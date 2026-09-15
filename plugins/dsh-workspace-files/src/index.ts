/**
 * `dsh-workspace-files` host half: registers the `/workspace-files` RPC
 * channel that lists one directory level with file/directory kinds and opens
 * a filesystem path in a specific desktop application — VS Code for code,
 * MarkText for Markdown — on the connection transport. The shipped host
 * offers neither (its `host.listDirectory` lists directories only, and its
 * openers hand paths to the default application), so this channel is the
 * plugin's own surface; the client's default-app open still rides the
 * existing `host.openPath`.
 * @module @deepseek-ai/dsh-workspace-files
 */

import { readdir } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import { runNativeCommand } from '@deepseek-ai/dsh-native-command'
import z from '@deepseek-ai/schemastery'
import {
  loadState, pathExists, saveState, scanApps, parseState,
  type AppSlot, type SetupState,
} from './setup.ts'

/** One row of a workspace-files directory listing (wire type, browser-safe). */
export interface WorkspaceFilesEntry {
  /** Base name shown in the tree row. */
  name: string
  /** Absolute host path — the client never joins path segments itself. */
  path: string
  /** Directory or file. */
  kind: 'dir' | 'file'
  /** Hidden by the host platform's convention (dot-prefixed on POSIX); the client owns whether to show it. */
  hidden: boolean
}

/** `list` response value: one directory level. */
export interface WorkspaceFilesListing {
  /** Absolute path of the listed directory. */
  path: string
  /** Direct children, directories first, each group name-sorted. */
  entries: WorkspaceFilesEntry[]
}

/** Validated plugin configuration: the discovery seed and the legacy fallback. */
export interface Config {
  /** Executable that opens a code file: a PATH name or an absolute path (default `code`). */
  code: string
  /** First-choice Markdown editor: a PATH name or an absolute path (default `typora`). */
  typora: string
  /** Second-choice Markdown editor, used when `typora` does not resolve (default `marktext`). */
  marktext: string
}

export const Config: z<Config> = z.object({
  code: z.string().default('code'),
  typora: z.string().default('typora'),
  marktext: z.string().default('marktext'),
})

/** Display names of the candidates the fallback path can reach. */
const CANDIDATE_LABELS: Record<string, string> = {
  typora: 'Typora',
  marktext: 'MarkText',
  vscode: 'VS Code',
  wps: 'WPS Office',
}

/** Config values a discovery pass or a fallback resolution starts from, by candidate id. */
function configuredSeed(config: Config): Record<string, string> {
  return {
    typora: config.typora.trim(),
    marktext: config.marktext.trim(),
    vscode: config.code.trim(),
  }
}

/**
 * Resolve one configured value: an absolute path answers as given, a bare name
 * goes through PATH (and `App Paths` on Windows).
 * @param value - the configured PATH name or absolute path.
 * @param signal - caller cancellation.
 * @returns the resolved command, or undefined when it does not resolve.
 */
async function resolveConfiguredValue(value: string, signal: AbortSignal): Promise<string | undefined> {
  if (value.includes('/') || value.includes('\\')) return await pathExists(value) ? value : undefined
  try {
    if (process.platform === 'win32') {
      const probe = `$c = Get-Command -Name ${powershellLiteral(value)} -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1; if ($c) { $c.Source }`
      const result = await runNativeCommand('powershell.exe', ['-NoProfile', '-Command', probe], signal)
      const found = (result.stdout ?? '').trim()
      return found === '' ? undefined : found
    }
    const result = await runNativeCommand('which', [value], signal)
    const found = (result.stdout ?? '').trim().split(/\r?\n/)[0]
    return found === '' ? undefined : found
  } catch {
    return undefined
  }
}

/** One opener the host resolved for a slot. */
interface ResolvedOpener {
  /** Executable the opener runs. */
  command: string
  /** Display name used verbatim in the tree's labels. */
  label: string
}

/**
 * Resolve the executable one slot should launch. The wizard's answer wins;
 * a machine that never answered falls back to the plugin config's own values,
 * and a user who declined the whole feature has no opener at all — that "off"
 * state is what keeps the plugin from changing how files open.
 * @param slot - which slot to resolve.
 * @param state - persisted setup state.
 * @param config - validated plugin configuration.
 * @param signal - caller cancellation.
 * @returns the resolved opener, or undefined when the slot has none.
 */
async function resolveSlotOpener(
  slot: AppSlot,
  state: SetupState,
  config: Config,
  signal: AbortSignal,
): Promise<ResolvedOpener | undefined> {
  const entry = state.apps[slot]
  if (entry !== undefined && entry.enabled && entry.command.trim() !== '') {
    return { command: entry.command, label: entry.label }
  }
  if (state.status === 'off') return undefined
  const seed = configuredSeed(config)
  const order = slot === 'markdown' ? ['typora', 'marktext'] : slot === 'code' ? ['vscode'] : []
  for (const id of order) {
    const value = seed[id]
    if (value === undefined || value === '') continue
    const command = await resolveConfiguredValue(value, signal)
    if (command !== undefined) return { command, label: CANDIDATE_LABELS[id] ?? id }
  }
  return undefined
}

/** Message used when a slot has no configured application to open with. */
function noOpenerMessage(slot: AppSlot): string {
  const what = slot === 'markdown' ? 'Markdown 编辑器' : slot === 'code' ? '代码编辑器' : '文档应用'
  return `没有配置可用的${what}：请在本插件侧栏的「打开方式设置」里选择或填写对应软件的启动路径`
}

/** Stable Cordis plugin name. */
export const name = 'workspace-files'
/**
 * Required services: the connection transport's RPC registry and the HTTP
 * server it mounts every registered channel on (the registry touches
 * `webServer` through the registering fiber, so it must be declared here).
 */
export const inject = ['connection', 'webServer']

/** Recover one validated `{ path }` request payload; undefined = malformed. */
function parsePath(payload: unknown): string | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined
  const path = (payload as Record<string, unknown>).path
  return typeof path === 'string' && path.length > 0 ? path : undefined
}

/** Recover a valid non-empty string field from a request payload. */
function parseStringField(payload: unknown, key: string): string | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined
  const value = (payload as Record<string, unknown>)[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/**
 * List one directory level: real files and directories only (symlinks,
 * sockets, and devices are skipped — a browser cannot open them in an
 * editor), directories first, each group name-sorted.
 * @param path - absolute directory to list.
 * @returns the level's file/directory rows.
 */
async function listDirectory(path: string): Promise<WorkspaceFilesListing> {
  const dirents = await readdir(path, { withFileTypes: true })
  const rows: WorkspaceFilesEntry[] = []
  for (const dirent of dirents) {
    if (!dirent.isDirectory() && !dirent.isFile()) continue
    rows.push({
      name: dirent.name,
      path: join(path, dirent.name),
      kind: dirent.isDirectory() ? 'dir' : 'file',
      hidden: dirent.name.startsWith('.'),
    })
  }
  rows.sort((a, b) =>
    a.kind === b.kind
      ? a.name.localeCompare(b.name)
      : a.kind === 'dir' ? -1 : 1)
  return { path, entries: rows }
}

/** PowerShell single-quoted literal (doubles embedded quotes). */
function powershellLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

/** Whether a native-command failure names a missing executable (en/zh PowerShell text). */
const NOT_FOUND_RE = /not (recognized|found)|CommandNotFound|无法将.+识别为|不是内部或外部命令/

/**
 * Run one configured opener executable against a path, surfacing actionable
 * failures. Windows opens through PowerShell because common openers are
 * `.cmd` shims (`code` → `code.cmd`) that `execFile` cannot spawn directly;
 * PowerShell resolves both PATH names and absolute paths and invokes `.cmd`
 * via cmd.exe internally. macOS/Linux run the executable directly.
 */
async function runOpener(command: string, path: string, signal: AbortSignal): Promise<void> {
  try {
    if (process.platform === 'win32') {
      await runNativeCommand(
        'powershell.exe',
        ['-NoProfile', '-Command', `& ${powershellLiteral(command)} ${powershellLiteral(path)}`],
        signal,
      )
    } else {
      await runNativeCommand(command, [path], signal)
    }
  } catch (error) {
    if (signal.aborted) throw error
    const message = error instanceof Error ? error.message : String(error)
    // ENOENT (macOS/Linux) or a PowerShell "not recognized" report = the
    // executable is not on PATH; name the fix instead of the raw error.
    if ((error as { code?: string } | null)?.code === 'ENOENT' || NOT_FOUND_RE.test(message)) {
      throw new Error(
        `找不到可执行程序 "${command}"：请确认已安装并加入 PATH，或在插件配置（cordis.patch.yml 的 workspace-files 行）中填写完整路径`,
      )
    }
    throw error instanceof Error ? error : new Error(message)
  }
}

/**
 * Open one path with the operating system's default application. Windows
 * resolves both files and directories through the shell's association, so
 * `Start-Process` covers the whole path space there; macOS and Linux use the
 * platform opener.
 * @param path - absolute host path to open.
 * @param signal - caller cancellation.
 */
async function openWithDefaultApp(path: string, signal: AbortSignal): Promise<void> {
  if (process.platform === 'win32') {
    await runNativeCommand(
      'powershell.exe',
      ['-NoProfile', '-Command', `Start-Process -FilePath ${powershellLiteral(path)}`],
      signal,
    )
    return
  }
  await runNativeCommand(process.platform === 'darwin' ? 'open' : 'xdg-open', [path], signal)
}

/**
 * Mount the `/workspace-files` RPC channel. Endpoints:
 * - `list` — one directory level with file/directory kinds (`{ path }` → {@link WorkspaceFilesListing})
 * - `state` — the persisted first-run setup (→ {@link SetupState})
 * - `scan` — discover the desktop applications this machine has (`{ deep? }` → `{ found, truncated }`)
 * - `save` — persist the wizard's answer (`{ status, apps }` → the saved state)
 * - `open-default` — open a path in the operating system's default application (`{ path }`)
 * - `open-in-code` / `open-in-markdown` / `open-in-office` — open a path through the configured slot
 * @param ctx - cordis context carrying the injected `connection` service.
 * @param config - validated opener executables.
 */
/** The absolute route path this plugin owns on the app's HTTP server. */
const ROUTE_PATH = '/workspace-files'

/** Largest request body this route accepts (every payload is a single path). */
const MAX_BODY_BYTES = 64 * 1024

/** Read one bounded JSON request body; `undefined` for an empty body. */
async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = chunk as Buffer
    size += buffer.length
    if (size > MAX_BODY_BYTES) throw new Error('request body exceeds the route limit')
    chunks.push(buffer)
  }
  if (chunks.length === 0) return undefined
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

/** Write one JSON response, owning its content length. */
function writeJson(response: ServerResponse, status: number, body: unknown): void {
  if (response.writableEnded || response.destroyed) return
  const payload = JSON.stringify(body)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  })
  response.end(payload)
}

/**
 * Mount the `/workspace-files` HTTP route. Endpoints, each a JSON POST
 * answering `{ ok: true, value }` or `{ ok: false, error: { message } }`:
 * - `list` — one directory level with file/directory kinds (`{ path }` → {@link WorkspaceFilesListing})
 * - `state` — the persisted first-run setup (→ {@link SetupState})
 * - `scan` — discover the desktop applications this machine has (`{ deep? }` → `{ found, truncated }`)
 * - `save` — persist the wizard's answer (`{ status, apps }` → the saved state)
 * - `open-default` — open a path in the operating system's default application (`{ path }`)
 * - `open-in-code` / `open-in-markdown` / `open-in-office` — open a path through the configured slot
 *
 * The route sits behind the connection service's Host/Origin fence and
 * browser-session check — the same policy every `/api` request carries — and
 * declares `webServer` because the route table lives on that service.
 * @param ctx - cordis context carrying the injected services.
 * @param config - validated opener executables.
 */
export function apply(ctx: Context, config: Config): void {
  ctx.inject(['webServer', 'connection'], (webCtx) => {
    /** Settle one endpoint call into the route's JSON envelope. */
    const settle = (
      response: ServerResponse,
      status: number,
      result: { ok: true, value: unknown } | { ok: false, message: string },
    ): void => {
      writeJson(response, status, result.ok
        ? { ok: true, value: result.value }
        : { ok: false, error: { message: result.message } })
    }

    const route: WebRoute = {
      kind: 'prefix',
      path: ROUTE_PATH,
      handler: async (request, response) => {
        const rejection = webCtx.connection.requestRejection(request)
        if (rejection !== undefined) {
          response.writeHead(rejection)
          response.end(rejection === 401 ? 'unauthorized' : 'forbidden')
          return
        }
        if (request.method !== 'POST') {
          settle(response, 405, { ok: false, message: 'workspace-files: this route accepts POST only' })
          return
        }
        const endpoint = new URL(request.url ?? '/', 'http://127.0.0.1')
          .pathname.slice(ROUTE_PATH.length + 1)
        let payload: unknown
        try {
          payload = await readJsonBody(request)
        } catch (error) {
          settle(response, 400, {
            ok: false,
            message: `workspace-files: malformed request body: ${error instanceof Error ? error.message : String(error)}`,
          })
          return
        }
        // A client that goes away aborts the work in flight (a half-open
        // editor launch is the case that matters).
        const controller = new AbortController()
        response.once('close', () => {
          if (!response.writableEnded) controller.abort()
        })
        const signal = controller.signal

        if (endpoint === 'list') {
          const path = parseStringField(payload, 'path')
          if (path === undefined) {
            settle(response, 400, { ok: false, message: 'workspace-files: list requires a non-empty string path' })
            return
          }
          try {
            settle(response, 200, { ok: true, value: await listDirectory(path) })
          } catch (error) {
            settle(response, 500, {
              ok: false,
              message: `workspace-files: 无法读取目录 ${path}: ${error instanceof Error ? error.message : String(error)}`,
            })
          }
          return
        }

        if (endpoint === 'state') {
          try {
            settle(response, 200, { ok: true, value: await loadState() })
          } catch (error) {
            settle(response, 500, { ok: false, message: error instanceof Error ? error.message : String(error) })
          }
          return
        }

        if (endpoint === 'scan') {
          const deep = typeof (payload as { deep?: unknown } | null)?.deep === 'boolean'
            && (payload as { deep?: boolean }).deep === true
          try {
            const result = await scanApps({ configured: configuredSeed(config), deep, signal })
            settle(response, 200, { ok: true, value: result })
          } catch (error) {
            if (signal.aborted) {
              settle(response, 499, { ok: false, message: 'workspace-files: the request was aborted' })
              return
            }
            settle(response, 500, { ok: false, message: error instanceof Error ? error.message : String(error) })
          }
          return
        }

        if (endpoint === 'save') {
          const saved = parseState(payload)
          if (saved === undefined) {
            settle(response, 400, { ok: false, message: 'workspace-files: save requires a status and an apps map' })
            return
          }
          try {
            await saveState(saved)
            settle(response, 200, { ok: true, value: saved })
          } catch (error) {
            settle(response, 500, { ok: false, message: error instanceof Error ? error.message : String(error) })
          }
          return
        }

        if (endpoint === 'open-default' || endpoint === 'open-in-code'
          || endpoint === 'open-in-markdown' || endpoint === 'open-in-office') {
          const path = parsePath(payload)
          if (path === undefined) {
            settle(response, 400, { ok: false, message: `workspace-files: ${endpoint} requires a non-empty string path` })
            return
          }
          try {
            if (endpoint === 'open-default') {
              await openWithDefaultApp(path, signal)
            } else {
              const slot: AppSlot = endpoint === 'open-in-code'
                ? 'code'
                : endpoint === 'open-in-markdown' ? 'markdown' : 'office'
              const state = await loadState()
              const opener = await resolveSlotOpener(slot, state, config, signal)
              if (opener === undefined) throw new Error(noOpenerMessage(slot))
              await runOpener(opener.command, path, signal)
            }
            settle(response, 200, { ok: true, value: { opened: true } })
          } catch (error) {
            if (signal.aborted) {
              settle(response, 499, { ok: false, message: 'workspace-files: the request was aborted' })
              return
            }
            settle(response, 500, { ok: false, message: error instanceof Error ? error.message : String(error) })
          }
          return
        }

        settle(response, 404, { ok: false, message: `workspace-files: unknown endpoint ${endpoint}` })
      },
    }

    webCtx.effect(() => webCtx.webServer.register(route), 'workspace-files: route')
  })
}
