/**
 * The SSH connection manager: one live ssh2 client with its SFTP channel at a
 * time, plus the remote file operations (list/read/write/mkdir/unlink) the
 * panel's file tree and editor use. Authentication follows the saved server
 * record: password, private key file, or the platform SSH agent.
 * @module @deepseek-ai/dsh-ssh-files/ssh
 */

import { readFile } from 'node:fs/promises'
import { Client, type ConnectConfig, type FileEntryWithStats, type SFTPWrapper, type Stats } from 'ssh2'
import type { SshServer } from './state.ts'

/** One file or directory row of a remote listing (wire type, browser-safe). */
export interface SshFileEntry {
  /** Base name shown in the tree row. */
  name: string
  /** Absolute remote path — the client never joins path segments itself. */
  path: string
  /** Directory or file. */
  kind: 'dir' | 'file'
  /** Hidden by the server platform's convention (dot-prefixed). */
  hidden: boolean
}

/** One listed remote directory level. */
export interface SshListing {
  /** Absolute path of the listed directory. */
  path: string
  /** Direct children, directories first, each group name-sorted. */
  entries: SshFileEntry[]
}

/** Result of a successful connect: the login home and the effective tree root. */
export interface SshConnectResult {
  /** The SFTP session's login directory (home). */
  home: string
  /** The directory the file tree opens at: the configured `root`, else home. */
  root: string
}

/** The character-cell size a PTY starts with and is resized to. */
export interface SshTerminalSize {
  /** Terminal width in character cells. */
  cols: number
  /** Terminal height in character cells. */
  rows: number
}

/** Callbacks one live shell reports through for its whole lifetime. */
export interface SshShellHandlers {
  /** Decoded terminal output, exactly as the remote PTY produced it. */
  onData: (text: string) => void
  /** The shell ended; `code`/`signal` come from the channel's close event. */
  onClose: (outcome: { code: number | null; signal: string | null }) => void
  /** The channel failed outside a normal close (the close callback still fires). */
  onError: (error: Error) => void
}

/** One live remote PTY shell. */
export interface SshShell {
  /** Send input (keystrokes) to the remote shell. */
  write(data: string): void
  /** Tell the remote PTY the client's new window size. */
  resize(size: SshTerminalSize): void
  /** Stop the remote channel from delivering data (stream backpressure). */
  pause(): void
  /** Resume a paused remote channel. */
  resume(): void
  /** End the remote shell. */
  close(): void
  /** Whether the channel is still usable. */
  readonly alive: boolean
}

/** One ssh2 SFTP method invoked with its trailing callback, as a promise.
 *  The `any[]` parameter and spread are required because ssh2's callback
 *  overloads are not assignable to a precise generic signature; the runtime
 *  call site is the only place argument arity is enforced. */
function sftpCall<T>(fn: (...args: any[]) => unknown, ...args: any[]): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    fn(...args, (error: Error | null | undefined, value: T) => {
      if (error) reject(error)
      else resolve(value)
    })
  })
}

/** Join a remote directory and a base name with the POSIX separator (SFTP
 *  paths are always `/`-separated, never platform `node:path` separators). */
function joinRemote(dir: string, name: string): string {
  return dir.endsWith('/') ? dir + name : `${dir}/${name}`
}

/** Single-quote a POSIX shell word (the remote server's login shell parses it). */
function posixQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

/** Cap a captured command stream; a `…` suffix marks truncation. */
function capOutput(text: string, maxChars: number): string {
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n… (输出已截断)` : text
}

/** Translate common ssh2 failure messages into actionable Chinese text. */
function mapSshError(error: unknown, server: SshServer): Error {
  const message = error instanceof Error ? error.message : String(error)
  const host = `${server.username}@${server.host}:${server.port}`
  if (/timed out while waiting for handshake|ETIMEDOUT|timeout/i.test(message)) {
    return new Error(`连接 ${host} 超时（${message}）`)
  }
  if (/all configured authentication methods failed|authentication failed/i.test(message)) {
    return new Error(`认证失败：请检查 ${host} 的用户名、密码或私钥`)
  }
  if (/ECONNREFUSED|Connection refused/i.test(message)) {
    return new Error(`连接被拒绝：${host} 的端口可能未开放或服务未启动`)
  }
  if (/ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(message)) {
    return new Error(`无法解析主机名：${server.host}`)
  }
  if (/encrypted private key|passphrase/i.test(message)) {
    return new Error(`私钥已加密：请使用 ssh-agent 认证或在服务器记录中改用密码认证`)
  }
  if (/no supported authentication methods/i.test(message)) {
    return new Error(`服务器不支持该认证方式：请为 ${host} 更换认证方式`)
  }
  return new Error(`连接 ${host} 失败：${message}`)
}

/** SFTP error codes we surface with friendlier text. */
const SFTP_ERROR_MESSAGES: Record<string, string> = {
  NO_SUCH_FILE: '文件或目录不存在',
  PERMISSION_DENIED: '权限不足',
  FAILURE: '操作失败（服务器拒绝）',
  NOT_A_DIRECTORY: '不是目录',
  IS_A_DIRECTORY: '是目录而非文件',
  NO_SUCH_PATH: '路径不存在',
  ALREADY_EXISTS: '已存在同名文件或目录',
}

/** Map an SFTP error to actionable Chinese text. */
function mapSftpError(error: unknown): Error {
  const err = error as { code?: string | number; message?: string } | null
  const code = err?.code
  const key = typeof code === 'string' ? code : String(code)
  const friendly = SFTP_ERROR_MESSAGES[key] ?? SFTP_ERROR_MESSAGES[code?.toString() ?? '']
  const raw = err?.message !== undefined && err.message !== '' ? err.message : String(error)
  return new Error(friendly !== undefined ? `${friendly}（${raw}）` : `远程操作失败：${raw}`)
}

/** A bounded SFTP round trip ended by caller cancellation or the op deadline.
 *  Tagged so file ops rethrow it verbatim instead of mapping it like a server
 *  failure: the connection is already gone by the time it is raised. */
class SftpStallError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SftpStallError'
  }
}

/**
 * The live SSH connection. Owns exactly one ssh2 client + SFTP channel;
 * `connect` replaces any previous connection and `disconnect` tears it down.
 * All file operations throw when no connection is active.
 */
export class SshConnection {
  private client: Client | null = null
  private sftp: SFTPWrapper | null = null
  private server: SshServer | null = null
  private home: string | null = null

  /**
   * @param opTimeoutMs - deadline for one SFTP round trip. A server that does
   *   not answer within it is disconnected: ssh2 cannot cancel an in-flight
   *   SFTP request, so ending the connection is how the wait ends.
   */
  constructor(private readonly opTimeoutMs = 120000) {}

  /** Whether an SFTP channel is currently usable. */
  get connected(): boolean {
    return this.client !== null && this.sftp !== null
  }

  /** The server record of the active connection, or null. */
  get activeServer(): SshServer | null {
    return this.server
  }

  /** The resolved login home of the active connection, or null. */
  get activeHome(): string | null {
    return this.home
  }

  /** The active SFTP channel, throwing a clear error when not connected. */
  private requireSftp(): SFTPWrapper {
    if (this.sftp === null) throw new Error('尚未连接服务器，请先在面板中选择并连接')
    return this.sftp
  }

  /**
   * Connect to a server: open the ssh2 client, then its SFTP channel, then
   * resolve the login home. Any prior connection is dropped first.
   * @param server - the server record to connect to.
   * @param timeoutMs - handshake timeout (ssh2 `readyTimeout`).
   * @param signal - abort cancels the attempt.
   * @returns the login home and the effective tree root.
   */
  async connect(server: SshServer, timeoutMs: number, signal: AbortSignal): Promise<SshConnectResult> {
    await this.disconnect()
    const client = new Client()
    this.client = client
    this.server = server
    try {
      const sftp = await this.openSftp(client, server, timeoutMs, signal)
      this.sftp = sftp
      let home: string
      try {
        home = await this.boundedSftp('解析主目录', signal, () =>
          sftpCall<string>(sftp.realpath.bind(sftp), '.'))
      } catch (error) {
        if (error instanceof SftpStallError) throw error
        // A home probe that fails (unusual) still leaves the session usable;
        // fall back to the server's root or "/" so the tree has a base.
        home = server.root.trim() !== '' ? server.root : '/'
      }
      this.home = home
      const root = server.root.trim() !== '' ? server.root : home
      return { home, root }
    } catch (error) {
      this.client = null
      this.sftp = null
      this.server = null
      this.home = null
      try { client.end() } catch { /* best-effort teardown */ }
      throw error
    }
  }

  /** Open the ssh2 client and its SFTP channel as one promise. */
  private async openSftp(
    client: Client, server: SshServer, timeoutMs: number, signal: AbortSignal,
  ): Promise<SFTPWrapper> {
    let config: ConnectConfig
    try {
      config = await this.buildConfig(server, timeoutMs)
    } catch (error) {
      throw mapSshError(error, server)
    }
    return new Promise<SFTPWrapper>((resolve, reject) => {
      let settled = false
      const fail = (error: Error): void => {
        if (settled) return
        settled = true
        signal.removeEventListener('abort', onAbort)
        reject(error)
      }
      const onAbort = (): void => {
        fail(new Error('连接已取消'))
        try { client.end() } catch { /* best-effort teardown */ }
      }
      const onError = (error: Error): void => {
        fail(mapSshError(error, server))
      }
      client.once('error', onError)
      client.once('ready', () => {
        client.sftp((error, sftp) => {
          if (error) {
            fail(mapSshError(error, server))
            return
          }
          if (sftp === undefined) {
            fail(new Error('服务器未提供 SFTP 通道'))
            return
          }
          settled = true
          signal.removeEventListener('abort', onAbort)
          resolve(sftp)
        })
      })
      client.once('close', () => {
        if (!settled) fail(new Error('连接在就绪前被服务器关闭'))
      })
      if (signal.aborted) {
        onAbort()
        return
      }
      signal.addEventListener('abort', onAbort, { once: true })
      try {
        client.connect(config)
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)))
      }
    })
  }

  /**
   * Build the ssh2 connect config from a server record. `password` and `key`
   * set their ssh2 fields; `agent` (and any record with neither) leaves ssh2
   * to its default authentication order (agent then `~/.ssh` keys).
   */
  private async buildConfig(server: SshServer, timeoutMs: number): Promise<ConnectConfig> {
    const config: ConnectConfig = {
      host: server.host,
      port: server.port,
      username: server.username,
      readyTimeout: timeoutMs,
      keepaliveInterval: 30000,
      keepaliveCountMax: 3,
    }
    if (server.auth === 'password' && server.password !== undefined && server.password !== '') {
      config.password = server.password
    } else if (server.auth === 'key' && server.keyPath !== undefined && server.keyPath !== '') {
      try {
        config.privateKey = await readFile(server.keyPath, 'utf8')
      } catch (error) {
        throw new Error(`无法读取私钥文件 ${server.keyPath}：${(error as NodeJS.ErrnoException).code ?? error}`)
      }
    }
    return config
  }

  /** Tear down the active connection (no-op when none is active). */
  async disconnect(): Promise<void> {
    const client = this.client
    this.client = null
    this.home = null
    this.sftp = null
    this.server = null
    if (client === null) return
    try { client.end() } catch { /* best-effort teardown */ }
  }

  /**
   * Run one SFTP request under the op deadline and the caller's abort signal,
   * mapping genuine SFTP failures to friendly text. ssh2 cannot cancel one
   * in-flight request: when the deadline passes or the signal aborts, the
   * whole connection is ended so this request (and any sibling on it) settles
   * instead of hanging — the caller-visible stop path requires the tool body
   * to reach quiescence before the turn can abort.
   * @param what - operation name for the stall message.
   * @param signal - caller cancellation; abort rejects with a stall error.
   * @param start - starts the SFTP request and returns its promise.
   */
  private async boundedSftp<T>(
    what: string,
    signal: AbortSignal | undefined,
    start: () => Promise<T>,
  ): Promise<T> {
    if (signal?.aborted === true) {
      throw new SftpStallError(`操作已取消（${what}）`)
    }
    return new Promise<T>((resolve, reject) => {
      let settled = false
      let timer: ReturnType<typeof setTimeout> | undefined
      const finish = (error: Error | null, value: T | undefined): void => {
        if (settled) return
        settled = true
        if (timer !== undefined) clearTimeout(timer)
        signal?.removeEventListener('abort', onAbort)
        if (error !== null) reject(error)
        else resolve(value as T)
      }
      const onAbort = (): void => {
        if (settled) return
        void this.disconnect()
        finish(new SftpStallError(`操作已取消（${what}）`), undefined)
      }
      timer = setTimeout(() => {
        if (settled) return
        void this.disconnect()
        finish(new SftpStallError(
          `${what}超时：服务器超过 ${this.opTimeoutMs} ms 未响应，连接已断开`), undefined)
      }, this.opTimeoutMs)
      signal?.addEventListener('abort', onAbort, { once: true })
      if (signal?.aborted === true) {
        onAbort()
        return
      }
      try {
        start().then(
          (value) => finish(null, value),
          (error) => finish(mapSftpError(error), undefined),
        )
      } catch (error) {
        finish(mapSftpError(error), undefined)
      }
    })
  }

  /** Classify one readdir row: resolve symlinks so the tree shows the target kind. */
  private async classifyEntry(
    entry: FileEntryWithStats, dirPath: string, signal: AbortSignal | undefined,
  ): Promise<'dir' | 'file'> {
    if (entry.attrs.isDirectory()) return 'dir'
    if (entry.attrs.isFile()) return 'file'
    if (entry.attrs.isSymbolicLink()) {
      const sftp = this.requireSftp()
      try {
        const target = await this.boundedSftp('解析链接目标', signal, () =>
          sftpCall<Stats>(sftp.stat.bind(sftp), joinRemote(dirPath, entry.filename)))
        return target.isDirectory() ? 'dir' : 'file'
      } catch (error) {
        if (error instanceof SftpStallError) throw error
        return 'file'
      }
    }
    // Sockets, devices, and pipes: show as files; opening them fails with the
    // server's own error text.
    return 'file'
  }

  /**
   * List one remote directory level: directories first, each group
   * name-sorted, symlinks classified by their resolved target.
   * @param path - absolute remote directory to list.
   * @returns the level's rows.
   */
  async list(path: string, signal?: AbortSignal): Promise<SshListing> {
    const sftp = this.requireSftp()
    const rows = await this.boundedSftp('列出目录', signal, () =>
      sftpCall<FileEntryWithStats[]>(sftp.readdir.bind(sftp), path))
    const entries: SshFileEntry[] = []
    for (const row of rows) {
      const kind = await this.classifyEntry(row, path, signal)
      entries.push({
        name: row.filename,
        path: joinRemote(path, row.filename),
        kind,
        hidden: row.filename.startsWith('.'),
      })
    }
    entries.sort((a, b) =>
      a.kind === b.kind
        ? a.name.localeCompare(b.name)
        : a.kind === 'dir' ? -1 : 1)
    return { path, entries }
  }

  /**
   * Read a remote file as UTF-8 text. Binary content and files above
   * `maxBytes` are rejected so the browser editor never holds junk.
   * @param path - absolute remote path.
   * @param maxBytes - size cap; larger files are refused with a clear message.
   * @returns the decoded text.
   */
  async read(path: string, maxBytes: number, signal?: AbortSignal): Promise<string> {
    const sftp = this.requireSftp()
    const stats = await this.boundedSftp('读取', signal, () => sftpCall<Stats>(sftp.stat.bind(sftp), path))
    if (stats.isDirectory()) throw new Error('这是一个目录，请展开后选择文件')
    if (stats.size > maxBytes) {
      throw new Error(`文件过大（${stats.size} 字节，超过 ${maxBytes} 字节上限），无法在面板中编辑`)
    }
    const buffer = await this.boundedSftp('读取', signal, () => sftpCall<Buffer>(sftp.readFile.bind(sftp), path))
    const text = buffer.toString('utf8')
    if (text.includes('\0')) throw new Error('检测到二进制内容，无法以文本方式编辑')
    return text
  }

  /**
   * Write a remote file atomically: temp file on the server, then POSIX
   * rename over the target. A failed upload leaves the target untouched.
   * @param path - absolute remote path (created when missing).
   * @param content - the UTF-8 text to write.
   */
  async write(path: string, content: string, signal?: AbortSignal): Promise<void> {
    const sftp = this.requireSftp()
    const tmp = `${path}.dsh-edit-${process.pid}-${Date.now()}`
    const buffer = Buffer.from(content, 'utf8')
    try {
      await this.boundedSftp('写入', signal, () => sftpCall<void>(sftp.writeFile.bind(sftp), tmp, buffer))
      await this.boundedSftp('重命名', signal, () => sftpCall<void>(sftp.rename.bind(sftp), tmp, path))
    } catch (error) {
      if (!(error instanceof SftpStallError)) {
        // A genuine server failure may have left the temp file; a stall has
        // already ended the connection, so cleanup would only wait again.
        try {
          await this.boundedSftp('清理临时文件', undefined, () => sftpCall<void>(sftp.unlink.bind(sftp), tmp))
        } catch { /* best-effort cleanup */ }
      }
      throw error
    }
  }

  /** Create one remote directory (parent must exist). */
  async mkdir(path: string, signal?: AbortSignal): Promise<void> {
    const sftp = this.requireSftp()
    await this.boundedSftp('创建目录', signal, () => sftpCall<void>(sftp.mkdir.bind(sftp), path))
  }

  /** Delete one remote file or (empty) directory. */
  async unlink(path: string, signal?: AbortSignal): Promise<void> {
    const sftp = this.requireSftp()
    const stats = await this.boundedSftp('读取', signal, () => sftpCall<Stats>(sftp.stat.bind(sftp), path))
    if (stats.isDirectory()) {
      await this.boundedSftp('删除目录', signal, () => sftpCall<void>(sftp.rmdir.bind(sftp), path))
    } else {
      await this.boundedSftp('删除', signal, () => sftpCall<void>(sftp.unlink.bind(sftp), path))
    }
  }

  /**
   * The connection's ssh2 client, throwing a clear error when not connected.
   * The shell only needs the transport, not the SFTP channel.
   */
  private requireClient(): Client {
    if (this.client === null) throw new Error('尚未连接服务器，请先连接（ssh_connect 或右侧面板）')
    return this.client
  }

  /**
   * Open one interactive shell (PTY) on the connection for the panel's
   * terminal. Output arrives decoded through {@link SshShellHandlers.onData}
   * and includes the prompt and echo the remote terminal produces; the caller
   * owns display state, this object owns only the channel.
   * @param size - initial terminal size (character cells).
   * @param handlers - output, close, and failure callbacks.
   * @param signal - aborts the attempt before the channel opens.
   * @returns the live shell handle.
   */
  async openShell(
    size: SshTerminalSize,
    handlers: SshShellHandlers,
    signal?: AbortSignal,
  ): Promise<SshShell> {
    const client = this.requireClient()
    return new Promise<SshShell>((resolve, reject) => {
      let settled = false
      const onAbort = (): void => {
        if (settled) return
        settled = true
        reject(new Error('打开终端已取消'))
      }
      signal?.addEventListener('abort', onAbort, { once: true })
      if (signal?.aborted === true) {
        onAbort()
        return
      }
      client.shell({ term: 'xterm-256color', cols: size.cols, rows: size.rows }, (error, channel) => {
        signal?.removeEventListener('abort', onAbort)
        if (error) {
          settled = true
          reject(error instanceof Error ? error : new Error(String(error)))
          return
        }
        // A multi-byte character may straddle two chunks; the streaming decoder
        // keeps the partial sequence until the rest arrives.
        const decoder = new TextDecoder('utf-8')
        let alive = true
        let handed = false
        const shell: SshShell = {
          get alive(): boolean { return alive },
          write: (data: string): void => {
            if (!alive || data.length === 0) return
            try { channel.write(data) } catch { /* the channel closed mid-write */ }
          },
          resize: ({ cols, rows }: SshTerminalSize): void => {
            if (!alive) return
            // Older servers may refuse a window change; the shell stays usable.
            try { channel.setWindow(rows, cols, 0, 0) } catch { /* ignored */ }
          },
          pause: (): void => {
            try { channel.pause() } catch { /* already closed */ }
          },
          resume: (): void => {
            try { channel.resume() } catch { /* already closed */ }
          },
          close: (): void => {
            try { channel.close() } catch { /* already closed */ }
          },
        }
        channel.on('data', (chunk: Buffer) => {
          handlers.onData(decoder.decode(chunk, { stream: true }))
        })
        // A PTY normally folds stderr into the same stream; when the server
        // keeps it separate, it is output all the same.
        channel.stderr?.on('data', (chunk: Buffer) => {
          handlers.onData(decoder.decode(chunk, { stream: true }))
        })
        channel.on('close', (code: number | null, signalName?: string) => {
          alive = false
          if (handed) handlers.onClose({ code: code ?? null, signal: signalName ?? null })
          else {
            handed = true
            reject(new Error('远程终端在打开时即结束'))
          }
        })
        channel.on('error', (channelError: Error) => {
          alive = false
          if (handed) handlers.onError(channelError)
          else {
            handed = true
            reject(channelError)
          }
        })
        handed = true
        resolve(shell)
      })
    })
  }

  /**
   * Run one remote command over the ssh2 shell channel and capture its
   * output. The command runs in the login shell; an optional `cwd` first
   * `cd`s into a directory (single-quoted against shell metacharacters).
   * @param command - the command line to run.
   * @param options - an optional working directory and per-stream cap.
   * @returns exit code plus captured stdout/stderr, each capped.
   */
  async exec(
    command: string,
    options: { cwd?: string; maxChars?: number } = {},
    signal?: AbortSignal,
  ): Promise<{ code: number | null; stdout: string; stderr: string }> {
    const client = this.client
    if (client === null || this.sftp === null) {
      throw new Error('尚未连接服务器，请先连接（ssh_connect 或右侧面板）')
    }
    const maxChars = options.maxChars ?? 20000
    const full = options.cwd !== undefined && options.cwd !== ''
      ? `cd ${posixQuote(options.cwd)} && ${command}`
      : command
    return new Promise((resolve, reject) => {
      let settled = false
      const finish = (outcome: { code: number | null; stdout: string; stderr: string }): void => {
        if (settled) return
        settled = true
        signal?.removeEventListener('abort', onAbort)
        resolve(outcome)
      }
      const fail = (error: Error): void => {
        if (settled) return
        settled = true
        signal?.removeEventListener('abort', onAbort)
        reject(error)
      }
      const onAbort = (): void => {
        fail(new Error('命令执行已取消'))
        try { stream?.close() } catch { /* best-effort */ }
      }
      let stream: { close(): void } | undefined
      client.exec(full, (error, channel) => {
        if (error) {
          fail(error instanceof Error ? error : new Error(String(error)))
          return
        }
        stream = channel
        let stdout = ''
        let stderr = ''
        let code: number | null = null
        channel.on('data', (chunk: Buffer) => {
          stdout = capOutput(stdout + chunk.toString('utf8'), maxChars)
        })
        if (channel.stderr !== undefined) {
          channel.stderr.on('data', (chunk: Buffer) => {
            stderr = capOutput(stderr + chunk.toString('utf8'), maxChars)
          })
        }
        channel.on('close', (closeCode: number) => {
          code = closeCode
          finish({ code, stdout, stderr })
        })
        channel.on('error', (channelError: Error) => {
          fail(channelError)
        })
      })
      if (signal?.aborted === true) onAbort()
      signal?.addEventListener('abort', onAbort, { once: true })
    })
  }
}
