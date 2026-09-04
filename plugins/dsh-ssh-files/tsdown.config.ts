import { readFileSync } from 'node:fs'
import { isBuiltin } from 'node:module'
import { fileURLToPath } from 'node:url'
import { clientBundle } from '../../client/tsdown.client.ts'

// The preset externalizes a package's own production sections and inlines
// everything else into lib/index.js. `ssh2` and its optional native
// host-verification binding (`cpu-features`) stay external on top of that:
// bundling ssh2 into an ESM artifact breaks its emscripten-compiled fallbacks,
// which reference the CJS globals `__dirname`/`__filename`, so the host loads
// the real CJS package from the plugin's own node_modules instead (installed
// as a devDependency by the repository; resolved at runtime through the
// ordinary parent-walk). `cpu-features`' native build is denied in
// pnpm-workspace.yaml, so at runtime `require('cpu-features')` throws and
// ssh2's own try/catch falls back to its pure-JS implementation.
const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'),
) as {
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

const production = new Set([
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.peerDependencies ?? {}),
  ...Object.keys(manifest.optionalDependencies ?? {}),
])

const isExternal = (specifier: string): boolean =>
  production.has(specifier) || specifier === 'ssh2' || specifier === 'cpu-features'

// hostPhase: the host half (lib) is emitted by the Host build face and the
// browser bundle by the Client face — one package, two programs.
export default clientBundle('@deepseek-ai/dsh-ssh-files', ['lib/types/index.js', 'lib/types/invariant.js'], {
  hostPhase: true,
  lib: {
    deps: {
      neverBundle: isExternal,
      alwaysBundle: (specifier) => !isBuiltin(specifier) && !isExternal(specifier),
    },
  },
})
