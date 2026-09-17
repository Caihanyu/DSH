/**
 * Standalone client-bundle builder for the DSH UI plugins in this repository.
 *
 * The harness serves each browser plugin's prebuilt `lib/client.js`, so the
 * plugin repositories build here instead of inside the harness monorepo. This
 * script mirrors the shipped `clientBundle` preset's artifact contract:
 *
 * - the artifact is a CJS closure factory handed to `window.__ModuleLoader__.load`,
 *   whose `require` answers exactly the shell's frozen platform module table;
 * - platform modules stay external, every other dependency inlines;
 * - `*.module.css` compiles through lightningcss into a hashed class map plus
 *   one tagged `<style>` tag injected at factory execution;
 * - type-only imports are erased by esbuild, so they create no runtime request.
 *
 * Usage: node build/client-bundle.mjs <plugin-directory>
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Load the build toolchain from the plugin's own install (the README's
 * `npm install` inside the plugin directory), falling back to the repository's
 * resolution so an install at either level works.
 * @param pluginDir - the plugin package directory.
 * @returns the loaded esbuild and lightningcss modules.
 */
function loadToolchain(pluginDir) {
  const fromPlugin = createRequire(join(pluginDir, 'package.json'))
  const fromBuilder = createRequire(import.meta.url)
  const load = (specifier) => {
    for (const require of [fromPlugin, fromBuilder]) {
      try {
        return require(specifier)
      } catch { /* try the next resolution root */ }
    }
    throw new Error(`client-bundle: cannot resolve ${specifier}; run npm install in the plugin directory`)
  }
  const esbuild = load('esbuild')
  const lightningcss = load('lightningcss')
  return {
    build: esbuild.build ?? esbuild.default?.build,
    transform: lightningcss.transform ?? lightningcss.default?.transform,
  }
}

/** The module specifiers the web shell shares into its frozen module table. */
const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
]

/** Emit one plugin-owned style injector and the CSS Modules class map. */
function styleInjectionModule(id, fileId, css, classMap) {
  const source = [
    `const css = ${JSON.stringify(css)};`,
    `const tagId = ${JSON.stringify(`${id}/${fileId.split(/[\\/]/).pop()}`)};`,
    'if (typeof document !== \'undefined\' && document.querySelector(\'style[data-plugin-css=\' + JSON.stringify(tagId) + \']\') === null) {',
    `  const tag = document.createElement('style');`,
    `  tag.dataset.plugin = ${JSON.stringify(id)};`,
    '  tag.dataset.pluginCss = tagId;',
    '  tag.textContent = css;',
    '  document.head.appendChild(tag);',
    '}',
  ]
  source.push(classMap === undefined ? 'export {};' : `export default ${JSON.stringify(classMap)};`)
  return source.join('\n')
}

/** Compile one stylesheet, returning its CSS text and (for modules) its class map. */
function compileStylesheet(toolchain, fileId, source, modules) {
  const { code, exports } = toolchain.transform({
    filename: fileId,
    code: source,
    ...(modules ? { cssModules: { pattern: '[hash]_[local]' } } : {}),
    minify: true,
  })
  if (!modules) return { css: code.toString(), classMap: undefined }
  const classMap = {}
  for (const [local, exp] of Object.entries(exports ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    classMap[local] = exp.name
  }
  return { css: code.toString(), classMap }
}

/** Resolve a relative stylesheet import against the importing file. */
function resolveSheet(source, importer) {
  return importer === undefined ? source : resolve(dirname(importer), source)
}

/**
 * Resolve one stylesheet specifier to an absolute file: a relative path against
 * its importer, a bare specifier through the importer's own package resolution
 * (the shape `@scope/package/styles.css` imports need).
 * @param specifier - the import specifier as written.
 * @param importer - absolute path of the importing file, when esbuild reports one.
 * @param pluginDir - the plugin package directory (resolution root of last resort).
 * @returns the absolute path esbuild should load.
 */
function resolveStylesheet(specifier, importer, pluginDir) {
  if (specifier.startsWith('.') || isAbsolute(specifier)) return resolveSheet(specifier, importer)
  const require = createRequire(importer ?? join(pluginDir, 'package.json'))
  return require.resolve(specifier)
}

/** esbuild plugin: inline every stylesheet the bundle imports. */
function stylesheetPlugin(id, toolchain, pluginDir) {
  return {
    name: 'dsh-css-inline',
    setup(pluginBuild) {
      pluginBuild.onResolve({ filter: /\.css$/ }, args => ({
        path: resolveStylesheet(args.path, args.importer, pluginDir),
        namespace: 'dsh-css',
      }))
      pluginBuild.onLoad({ filter: /.*/, namespace: 'dsh-css' }, async (args) => {
        const source = await readFile(args.path)
        const modules = args.path.endsWith('.module.css')
        const { css, classMap } = compileStylesheet(toolchain, args.path, source, modules)
        return { contents: styleInjectionModule(id, args.path, css, classMap), loader: 'js', resolveDir: dirname(args.path) }
      })
    },
  }
}

/**
 * Build one host-half entry (TS → ESM): the package's own modules bundle into
 * one artifact (their `.ts` specifiers are erased here, not at runtime), while
 * every npm dependency stays an import — the Node half runs from a real
 * install, so its dependencies resolve at runtime.
 * @param toolchain - the loaded esbuild/lightningcss modules.
 * @param source - absolute source file.
 * @param outfile - absolute emitted file.
 */
async function buildHostEntry(toolchain, source, outfile) {
  if (!existsSync(source)) return
  await toolchain.build({
    entryPoints: [source],
    outfile,
    bundle: true,
    packages: 'external',
    format: 'esm',
    platform: 'node',
    target: 'es2024',
    sourcemap: false,
    logLevel: 'warning',
    tsconfigRaw: { compilerOptions: { target: 'es2024', module: 'esnext', verbatimModuleSyntax: true, strict: true } },
  })
  console.log(`host-bundle:  ${source} -> ${outfile}`)
}

/**
 * Build one plugin: the browser half (client bundle) and the Node half.
 * @param pluginDir - the plugin package directory.
 */
async function main(pluginDir) {
  const dir = resolve(pluginDir)
  const manifestPath = join(dir, 'package.json')
  if (!existsSync(manifestPath)) throw new Error(`client-bundle: no package.json in ${dir}`)
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const id = manifest.name
  const toolchain = loadToolchain(dir)

  await buildHostEntry(toolchain, join(dir, 'src', 'index.ts'), join(dir, 'lib', 'index.js'))
  await buildHostEntry(toolchain, join(dir, 'src', 'invariant.ts'), join(dir, 'lib', 'invariant.js'))

  const entry = join(dir, 'src', 'client', 'index.ts')
  if (!existsSync(entry)) throw new Error(`client-bundle: no client entry at ${entry}`)
  const outfile = join(dir, 'lib', 'client.js')
  await mkdir(dirname(outfile), { recursive: true })

  const requested = new Set([...(manifest.dsh?.client?.external ?? [])])
  const external = [...PLATFORM_MODULES, ...requested]

  const result = await toolchain.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    jsx: 'automatic',
    jsxImportSource: 'react',
    external,
    minify: false,
    sourcemap: false,
    logLevel: 'warning',
    // The monorepo tsconfigs are absent here; state the compiler options the
    // client build needs instead of inheriting a missing base config.
    tsconfigRaw: {
      compilerOptions: {
        jsx: 'react-jsx',
        target: 'es2022',
        module: 'esnext',
        moduleResolution: 'bundler',
        verbatimModuleSyntax: true,
        strict: true,
      },
    },
    plugins: [stylesheetPlugin(id, toolchain, dir)],
    banner: {
      js: `window.__ModuleLoader__.load({\n  id: ${JSON.stringify(id)},\n  factory: (require) => {\nvar module = { exports: {} }; var exports = module.exports;`,
    },
    footer: { js: 'return module.exports; } });' },
  })

  if (result.errors.length > 0) throw new Error(`client-bundle: ${id} failed with ${result.errors.length} errors`)
  const size = (await readFile(outfile)).length
  console.log(`client-bundle: ${id} -> ${outfile} (${(size / 1024).toFixed(1)} KiB)`)
}

const target = process.argv[2] ?? fileURLToPath(new URL('.', import.meta.url))
await main(target)
