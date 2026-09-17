/**
 * `dsh-ssh-files` host half: mounts the `/ssh-files` RPC channel that the
 * browser panel drives and registers the model-facing `ssh_*` tools. Both
 * route through one {@link SshSessionStore}, which keeps a shared saved-server
 * pool plus an isolated preference and live SSH connection per session — local
 * work and each remote server session never share state or a channel. The
 * channel is loopback-only (the same trust fence as every `/api` request).
 * @module @deepseek-ai/dsh-ssh-files
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import { runNativeCommand } from '@deepseek-ai/dsh-native-command'
import z from '@deepseek-ai/schemastery'
import { SshSessionStore, type SessionKey } from './store.ts'
import type { SshMode } from './state.ts'
import type { SshTerminalSize } from './ssh.ts'
import { SshTerminalHub, type TerminalFrame } from './terminal.ts'
import { registerSshTools } from './tools.ts'

export type { SshMode, SshServer, SshAuth, SessionPref, SshState } from './state.ts'
export type { SshFileEntry, SshListing, SshShell, SshTerminalSize } from './ssh.ts'
export type { SshPanelState, SshStateResponse, SshServerInput } from './store.ts'
export { SshSessionStore } from './store.ts'
export { SshTerminalHub, type TerminalFrame } from './terminal.ts'

/** Validated plugin configuration. */
export interface Config {
  /** Size cap for one `read` (bytes); larger files are refused. */
  readMaxBytes: number
  /** SSH handshake timeout in milliseconds. */
  connectTimeoutMs: number
  /** Deadline for one SFTP round trip (ms); a silent server is disconnected. */
  opTimeoutMs: number
  /** Cap on one model `ssh_write` content (characters). */
  writeMaxChars: number
  /** Cap on one model `ssh_read` window (lines). */
  readMaxLines: number
  /** Cap on one `ssh_exec` captured stream (characters). */
  execMaxChars: number
  /** Replay budget for one session's terminal (characters; the tail is kept). */
  termBufferChars: number
  /** Executable that opens a code file: a PATH name or an absolute path. */
  code: string
  /** Executable that opens a Markdown file: a PATH name or an absolute path. */
  marktext: string
}

export const Config: z<Config> = z.object({
  readMaxBytes: z.number().default(1024 * 1024),
  connectTimeoutMs: z.number().default(15000),
  opTimeoutMs: z.number().default(120000),
  writeMaxChars: z.number().default(200000),
  readMaxLines: z.number().default(2000),
  execMaxChars: z.number().default(20000),
  termBufferChars: z.number().default(200000),
  code: z.string().default('code'),
  marktext: z.string().default('marktext'),
})

/** Stable Cordis plugin name. */
export const name = 'ssh-files'
/** Required services: the RPC registry, the tool registry, and system prompt. */
export const inject = ['connection', 'tools', 'systemPrompt']

/** A resolved (defaults-filled) config. */
type ResolvedConfig = Required<Config>

/** Recover the session key from a payload (`''` when absent = default session). */
function sessionKeyOf(payload: unknown): SessionKey {
  if (typeof payload === 'object' && payload !== null) {
    const value = (payload as Record<string, unknown>).sessionId
    return typeof value === 'string' && value.length > 0 ? value : ''
  }
  return ''
}

/** Recovers a validated `{ mode }` payload; undefined = malformed. */
function parseMode(payload: unknown): SshMode | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined
  const mode = (payload as Record<string, unknown>).mode
  return mode === 'local' || mode === 'ssh' ? mode : undefined
}

/** Recover a validated terminal size from a payload or query; undefined = malformed. */
function parseTerminalSize(source: Record<string, unknown>): SshTerminalSize | undefined {
  const cols = toDimension(source.cols, 20, 500)
  const rows = toDimension(source.rows, 4, 300)
  if (cols === undefined || rows === undefined) return undefined
  return { cols, rows }
}

/** Clamp one terminal dimension to a usable range; undefined when not a number. */
function toDimension(value: unknown, min: number, max: number): number | undefined {
  const numeric = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  if (typeof numeric !== 'number' || !Number.isFinite(numeric)) return undefined
  return Math.min(max, Math.max(min, Math.round(numeric)))
}

/** Recovers a valid non-empty string field from a request payload. */
function parseStringField(payload: unknown, key: string): string | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined
  const value = (payload as Record<string, unknown>)[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/** Recovers a valid string field (may be empty) from a request payload. */
function parseOptionalString(payload: unknown, key: string): string | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined
  const value = (payload as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}

/**
 * Validate an add/update server payload, or throw with the first invalid
 * field named. Passwords arrive over the loopback fence; the record is
 * persisted in the plugin's own state file.
 */
function parseServerInput(payload: unknown): import('./store.ts').SshServerInput {
  if (typeof payload !== 'object' || payload === null) throw new Error('服务器信息格式无效')
  const record = payload as Record<string, unknown>
  const name = parseStringField(record, 'name')
  const host = parseStringField(record, 'host')
  const username = parseOptionalString(record, 'username')
  const root = parseOptionalString(record, 'root') ?? ''
  const auth = record.auth
  if (name === undefined) throw new Error('请填写服务器名称')
  if (host === undefined) throw new Error('请填写主机地址')
  if (username === undefined || username === '') throw new Error('请填写登录用户名')
  if (auth !== 'password' && auth !== 'key' && auth !== 'agent') throw new Error('认证方式无效')
  const port = record.port
  if (typeof port !== 'number' || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('端口必须是 1-65535 的整数')
  }
  const input: import('./store.ts').SshServerInput = {
    name, host, port, username, auth, root,
  }
  const password = parseOptionalString(record, 'password')
  if (password !== undefined) input.password = password
  const keyPath = parseOptionalString(record, 'keyPath')
  if (keyPath !== undefined) input.keyPath = keyPath
  return input
}

/** PowerShell single-quoted literal (doubles embedded quotes). */
function powershellLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

/** Whether a native-command failure names a missing executable (en/zh text). */
const NOT_FOUND_RE = /not (recognized|found)|CommandNotFound|无法将.+识别为|不是内部或外部命令/

/**
 * Open one local path in a desktop app. Windows opens through PowerShell
 * because common openers are `.cmd` shims (`code` → `code.cmd`) that
 * `execFile` cannot spawn directly; macOS/Linux run the executable directly.
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
    if ((error as { code?: string } | null)?.code === 'ENOENT' || NOT_FOUND_RE.test(message)) {
      throw new Error(
        `找不到可执行程序 "${command}"：请确认已安装并加入 PATH，或在插件配置（cordis.patch.yml 的 ssh-files 行）中填写完整路径`,
      )
    }
    throw error instanceof Error ? error : new Error(message)
  }
}

/** The absolute route path this plugin owns on the app's HTTP server. */
const ROUTE_PATH = '/ssh-files'

/** Largest request body this route accepts (file writes are the big case). */
const MAX_BODY_BYTES = 32 * 1024 * 1024

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
 * Mount the `/ssh-files` HTTP route and register the `ssh_*` tools.
 *
 * Route endpoints (each a JSON POST whose response is `{ ok: true, value }` or
 * `{ ok: false, error: { message } }`; every state/fs endpoint takes the
 * session id in its payload, so each conversation panel reads and drives only
 * its own session):
 * - `get-state` / `set-mode` / `add-server` / `update-server` / `remove-server`
 *   / `connect` / `disconnect` — per-session state and the shared server pool.
 * - `list` / `read` / `write` / `mkdir` / `unlink` — mode-aware file operations
 *   for the calling session.
 * - `terminal-write` / `terminal-resize` / `terminal-close` — drive the
 *   session's remote PTY shell (the shell itself is opened by attaching to the
 *   stream below, so it survives the panel switching views).
 * - `terminal-stream` — the route's only GET: a long-lived NDJSON stream of
 *   `snapshot` / `data` / `exit` / `error` / `ping` frames from the session's
 *   shell, the panel's terminal window onto it.
 * - `open-local` — open a local path in a desktop app (local mode only).
 *
 * The route sits behind the connection service's Host/Origin fence and
 * browser-session check — the same policy every `/api` request carries — and
 * declares `webServer` because the route table lives on that service.
 * @param ctx - cordis context carrying `tools` and `systemPrompt`.
 * @param config - validated read caps, timeouts, and desktop openers.
 */
export function apply(ctx: Context, config: Config): void {
  const resolved = config as ResolvedConfig
  const store = new SshSessionStore(resolved.opTimeoutMs)
  ctx.effect(() => () => { void store.dispose() }, 'ssh-files: session teardown')

  // Interactive terminals reuse the session's live SSH connection; a session
  // that is not connected reports that through the stream's failure frame.
  const terminals = new SshTerminalHub(
    sessionId => store.requireConnectedFor(sessionId),
    resolved.termBufferChars,
  )
  ctx.effect(() => () => { terminals.dispose() }, 'ssh-files: terminal teardown')

  // Model-facing tools share the same per-session store as the panel.
  registerSshTools(ctx, store, {
    connectTimeoutMs: resolved.connectTimeoutMs,
    readMaxBytes: resolved.readMaxBytes,
    writeMaxChars: resolved.writeMaxChars,
    readMaxLines: resolved.readMaxLines,
    execMaxChars: resolved.execMaxChars,
  })

  const handler = async (
    endpoint: string, payload: unknown, signal: AbortSignal,
  ): Promise<{ ok: true, value: unknown } | { ok: false, error: { code: string, message: string, details: Record<string, unknown> } }> => {
    try {
      const session = sessionKeyOf(payload)
      switch (endpoint) {
        case 'get-state':
          return { ok: true, value: await store.response(session) }
        case 'set-mode': {
          const mode = parseMode(payload)
          if (mode === undefined) throw new Error('工作方式无效：仅支持 local 与 ssh')
          return { ok: true, value: await store.setMode(session, mode) }
        }
        case 'add-server':
          return { ok: true, value: await store.addServer(parseServerInput(payload), session) }
        case 'update-server': {
          const record = (payload ?? {}) as Record<string, unknown>
          const id = parseStringField(record, 'id')
          if (id === undefined) throw new Error('缺少服务器 id')
          return { ok: true, value: await store.updateServer(id, parseServerInput(record.server), session) }
        }
        case 'remove-server': {
          const id = parseStringField(payload, 'id')
          if (id === undefined) throw new Error('缺少服务器 id')
          return { ok: true, value: await store.removeServer(id, session) }
        }
        case 'connect': {
          const id = parseStringField(payload, 'id')
          if (id === undefined) throw new Error('缺少服务器 id')
          return { ok: true, value: await store.connect(session, id, resolved.connectTimeoutMs, signal) }
        }
        case 'disconnect':
          return { ok: true, value: await store.disconnect(session) }
        case 'list': {
          const path = parseStringField(payload, 'path')
          if (path === undefined) throw new Error('缺少目录路径')
          return { ok: true, value: await store.list(session, path, signal) }
        }
        case 'read': {
          const path = parseStringField(payload, 'path')
          if (path === undefined) throw new Error('缺少文件路径')
          const content = await store.read(session, path, resolved.readMaxBytes, signal)
          return { ok: true, value: { content } }
        }
        case 'write': {
          const record = (payload ?? {}) as Record<string, unknown>
          const path = parseStringField(record, 'path')
          const content = record.content
          if (path === undefined) throw new Error('缺少文件路径')
          if (typeof content !== 'string') throw new Error('缺少文件内容')
          await store.write(session, path, content, signal)
          return { ok: true, value: { written: true as const } }
        }
        case 'mkdir': {
          const path = parseStringField(payload, 'path')
          if (path === undefined) throw new Error('缺少目录路径')
          await store.mkdir(session, path, signal)
          return { ok: true, value: { created: true as const } }
        }
        case 'unlink': {
          const path = parseStringField(payload, 'path')
          if (path === undefined) throw new Error('缺少路径')
          await store.unlink(session, path, signal)
          return { ok: true, value: { removed: true as const } }
        }
        case 'terminal-write': {
          const data = parseOptionalString(payload, 'data')
          if (data === undefined) throw new Error('缺少终端输入')
          terminals.write(session, data)
          return { ok: true, value: { written: true as const } }
        }
        case 'terminal-resize': {
          const size = parseTerminalSize((payload ?? {}) as Record<string, unknown>)
          if (size === undefined) throw new Error('终端尺寸无效（需要 cols 与 rows）')
          terminals.resize(session, size)
          return { ok: true, value: { resized: true as const } }
        }
        case 'terminal-close':
          terminals.close(session)
          return { ok: true, value: { closed: true as const } }
        case 'open-local': {
          const record = (payload ?? {}) as Record<string, unknown>
          const path = parseStringField(record, 'path')
          const command = record.command
          if (path === undefined) throw new Error('缺少文件路径')
          if (command !== 'code' && command !== 'marktext' && command !== 'default') throw new Error('缺少打开方式')
          if (command === 'default') await openWithDefaultApp(path, signal)
          else {
            await runOpener(
              command === 'code' ? resolved.code : resolved.marktext,
              path,
              signal,
            )
          }
          return { ok: true, value: { opened: true as const } }
        }
        default:
          throw new Error(`未知端点 ${endpoint}`)
      }
    } catch (error) {
      if (signal.aborted) {
        return { ok: false, error: { code: 'cancelled', message: '操作已取消', details: {} } }
      }
      const message = error instanceof Error ? error.message : String(error)
      return { ok: false, error: { code: 'internal', message, details: {} } }
    }
  }
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

    /**
     * Serve one session's terminal output as NDJSON frames: the replay buffer
     * as the first `snapshot` frame, then live output until the client or the
     * shell ends. Attaching is what opens the shell; a session with no live
     * connection answers 409 with the connect hint instead of streaming.
     */
    const streamTerminal = async (
      request: IncomingMessage,
      response: ServerResponse,
      params: URLSearchParams,
    ): Promise<void> => {
      const sessionId = params.get('sessionId') ?? ''
      const size = parseTerminalSize({
        cols: params.get('cols') ?? undefined,
        rows: params.get('rows') ?? undefined,
      })
      if (size === undefined) {
        settle(response, 400, { ok: false, message: 'ssh-files: invalid terminal size (cols, rows)' })
        return
      }
      // Frames emitted while the snapshot is still being assembled queue here
      // and flush after it, so the client's screen always starts from the
      // replay buffer rather than from a mid-stream chunk.
      const pending: TerminalFrame[] = []
      let ready = false
      let closed = false
      let congested = false
      const writeFrame = (frame: TerminalFrame): void => {
        if (closed || response.writableEnded || response.destroyed) return
        if (response.write(`${JSON.stringify(frame)}\n`)) return
        // The socket is backed up: stop the remote channel delivering until the
        // response drains, instead of buffering the flood in this process.
        if (congested) return
        congested = true
        terminals.pause(sessionId)
        response.once('drain', () => {
          congested = false
          terminals.resume(sessionId)
        })
      }
      const detach = terminals.subscribe(sessionId, (frame) => {
        if (ready) writeFrame(frame)
        else pending.push(frame)
      })
      let snapshot: { snapshot: string; trimmed: boolean }
      try {
        snapshot = await terminals.attach(sessionId, size)
      } catch (error) {
        detach()
        settle(response, 409, {
          ok: false,
          message: error instanceof Error ? error.message : String(error),
        })
        return
      }
      response.writeHead(200, {
        'content-type': 'application/x-ndjson; charset=utf-8',
        'cache-control': 'no-store, no-transform',
        'x-accel-buffering': 'no',
      })
      response.flushHeaders()
      const ping = setInterval(() => { writeFrame({ kind: 'ping' }) }, 15000)
      const cleanup = (): void => {
        if (closed) return
        closed = true
        clearInterval(ping)
        detach()
        terminals.resume(sessionId)
      }
      request.on('close', cleanup)
      response.on('close', cleanup)
      response.on('error', cleanup)
      writeFrame({ kind: 'snapshot', data: snapshot.snapshot, trimmed: snapshot.trimmed })
      ready = true
      for (const frame of pending) writeFrame(frame)
      pending.length = 0
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
        const url = new URL(request.url ?? '/', 'http://127.0.0.1')
        const endpoint = url.pathname.slice(ROUTE_PATH.length + 1)
        if (request.method === 'GET') {
          if (endpoint !== 'terminal-stream') {
            settle(response, 405, {
              ok: false,
              message: 'ssh-files: GET serves terminal-stream only; every other endpoint is a JSON POST',
            })
            return
          }
          await streamTerminal(request, response, url.searchParams)
          return
        }
        if (request.method !== 'POST') {
          settle(response, 405, { ok: false, message: 'ssh-files: this route accepts POST only' })
          return
        }
        let payload: unknown
        try {
          payload = await readJsonBody(request)
        } catch (error) {
          settle(response, 400, {
            ok: false,
            message: `ssh-files: malformed request body: ${error instanceof Error ? error.message : String(error)}`,
          })
          return
        }
        // A client that goes away aborts the work in flight (a listing or
        // transfer the user navigated away from is the case that matters).
        const controller = new AbortController()
        response.once('close', () => {
          if (!response.writableEnded) controller.abort()
        })
        const result = await handler(endpoint, payload, controller.signal)
        settle(response, result.ok ? 200 : 500, result.ok
          ? { ok: true, value: result.value }
          : { ok: false, message: result.error.message })
      },
    }

    webCtx.effect(() => webCtx.webServer.register(route), 'ssh-files: route')
  })
}
