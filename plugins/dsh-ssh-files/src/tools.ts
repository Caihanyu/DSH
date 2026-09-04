/**
 * Model-facing `ssh_*` tools for `dsh-ssh-files`. Each call routes through
 * the session of the agent that issued it (`exec.agent.id` — the same session
 * key the `/ssh-files` panel uses), so a conversation's SSH operations are
 * isolated per session: server A in one conversation never shares a channel
 * or preference with server B in another, and local work is untouched.
 * Without an agent (direct SDK/headless dispatch) the tools fall back to the
 * `''` default session, matching the RPC channel's default.
 * @module @deepseek-ai/dsh-ssh-files/tools
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-system-prompt'
import { SshSessionStore } from './store.ts'

/** Session key of the agent that called a tool ('' when none). */
function sessionKeyOf(exec: { agent?: { id: unknown } | undefined }): string {
  const id = exec.agent?.id
  return typeof id === 'string' && id.length > 0 ? id : ''
}

/** Tool caps derived from the plugin config plus fixed limits. */
export interface SshToolCaps {
  /** SSH handshake timeout (ms). */
  connectTimeoutMs: number
  /** Cap on one text read (bytes), matching the panel's read cap. */
  readMaxBytes: number
  /** Cap on one written file's characters (model output granularity). */
  writeMaxChars: number
  /** Cap on one read window's total lines. */
  readMaxLines: number
  /** Cap on one command's captured stream length. */
  execMaxChars: number
}

/** A plain text model block. */
const text = (value: string): { type: 'text'; text: string }[] => [{ type: 'text', text: value }]

/** Register the full `ssh_*` tool suite on `ctx.tools`. */
export function registerSshTools(ctx: Context, store: SshSessionStore, caps: SshToolCaps): void {
  const tools = ctx.tools

  tools.register(defineTool({
    name: 'ssh_status',
    description:
      'Report this conversation\'s SSH working state: every saved server (id, name, host) and which one this session is connected to (with its home). Use this first to learn the server ids for ssh_connect and the current connection.',
    parameters: {},
    output: {
      schema: { type: 'string' },
      render: (_args, value) => text(value),
    },
    async execute(_args, exec) {
      const state = await store.response(sessionKeyOf(exec))
      const connected = state.state.connected
      const server = connected
        ? state.state.servers.find(candidate => candidate.id === state.state.serverId)
        : undefined
      const lines = [
        `已保存服务器 ${state.state.servers.length} 台：`,
        ...state.state.servers.map(item => `- ${item.id}  ${item.name}  (${item.username}@${item.host}:${item.port})`),
        connected && server !== undefined
          ? `本会话已连接：${server.id}（${server.name}）`
          : '本会话未连接（用 ssh_connect 连接）',
      ]
      return lines.join('\n')
    },
  }))

  tools.register(defineTool({
    name: 'ssh_connect',
    description:
      'Connect this conversation\'s session to a saved server over SSH/SFTP. Pass the server id or display name from ssh_status. After this, ssh_list / ssh_read / ssh_write / ssh_exec operate on that server for this session only.',
    parameters: {
      server: { type: 'string', description: 'Saved server id or display name (see ssh_status).' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => text(value),
    },
    async execute(args, exec) {
      const sessionId = sessionKeyOf(exec)
      const reference = (args as { server?: unknown }).server
      const { server } = await store.ensureConnected(
        sessionId,
        typeof reference === 'string' ? reference : undefined,
        caps.connectTimeoutMs,
        exec.signal,
      )
      return `已连接 ${server.name}（${server.username}@${server.host}）`
    },
  }))

  tools.register(defineTool({
    name: 'ssh_disconnect',
    description: 'Disconnect this conversation\'s session from its current SSH server. The saved server record and preference are kept.',
    parameters: {},
    output: {
      schema: { type: 'string' },
      render: (_args, value) => text(value),
    },
    async execute(_args, exec) {
      const state = await store.disconnect(sessionKeyOf(exec))
      const name = state.state.servers.find(item => item.id === state.state.serverId)?.name ?? ''
      return name !== '' ? `已断开 ${name}。` : '本会话未连接。'
    },
  }))

  tools.register(defineTool({
    name: 'ssh_list',
    description:
      'List one directory on this conversation\'s connected SSH server. The tree is like a local readdir: directories first, then files, each name-sorted.',
    parameters: {
      path: { type: 'string', required: true, description: 'Absolute remote directory to list (e.g. /home/user or /).' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => text(value),
    },
    async execute(args, exec) {
      const conn = store.requireConnectedFor(sessionKeyOf(exec))
      const path = (args as { path: string }).path
      const listing = await conn.list(path, exec.signal)
      const rows = listing.entries.map(entry => `${entry.kind === 'dir' ? 'dir ' : 'file'} ${entry.path}${entry.hidden ? '  (hidden)' : ''}`)
      return rows.length > 0 ? rows.join('\n') : '（空目录）'
    },
  }))

  tools.register(defineTool({
    name: 'ssh_read',
    description:
      'Read a UTF-8 text file on this conversation\'s connected SSH server and return numbered lines. Use offset/limit to page through large files. Binary or oversized files are rejected.',
    parameters: {
      path: { type: 'string', required: true, description: 'Absolute remote file path.' },
      offset: { type: 'number', description: '1-based first line to return. Defaults to 1.' },
      limit: { type: 'number', description: `Maximum number of lines to return. Defaults to ${caps.readMaxLines}.` },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => text(value),
    },
    async execute(args, exec) {
      const conn = store.requireConnectedFor(sessionKeyOf(exec))
      const input = args as { path: string; offset?: number; limit?: number }
      const content = await conn.read(input.path, caps.readMaxBytes, exec.signal)
      const lines = content.split('\n')
      const total = lines.length
      const offset = typeof input.offset === 'number' && Number.isFinite(input.offset) && input.offset >= 1
        ? Math.floor(input.offset)
        : 1
      const limit = typeof input.limit === 'number' && Number.isFinite(input.limit) && input.limit >= 1
        ? Math.floor(input.limit)
        : caps.readMaxLines
      const slice = lines.slice(offset - 1, offset - 1 + limit)
      const width = String(offset - 1 + slice.length).length
      const body = slice
        .map((lineText, index) => `${String(offset + index).padStart(width)} | ${lineText}`)
        .join('\n')
      const truncated = offset - 1 + slice.length < total
      return `<path>${input.path}</path>\n<type>file</type>\n<content>\n${body}\n</content>\n`
        + `${truncated ? `（共 ${total} 行，已显示 ${offset}-${offset - 1 + slice.length} 行；用 offset=${offset + slice.length} 继续）` : `共 ${total} 行`}`
    },
  }))

  tools.register(defineTool({
    name: 'ssh_write',
    description:
      'Write (create or overwrite) one UTF-8 text file on this conversation\'s connected SSH server, atomically (temp + rename). Parent directories must exist; create them with ssh_mkdir.',
    parameters: {
      path: { type: 'string', required: true, description: 'Absolute remote file path.' },
      content: { type: 'string', required: true, description: 'Full text content to write.' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => text(value),
    },
    async execute(args, exec) {
      const conn = store.requireConnectedFor(sessionKeyOf(exec))
      const input = args as { path: string; content: string }
      if (input.content.length > caps.writeMaxChars) {
        throw new Error(`内容过长（${input.content.length} 字符，上限 ${caps.writeMaxChars}）：请分批或改用 ssh_exec 处理`)
      }
      await conn.write(input.path, input.content, exec.signal)
      return `已写入 ${input.path}`
    },
  }))

  tools.register(defineTool({
    name: 'ssh_mkdir',
    description: 'Create one directory on this conversation\'s connected SSH server (parent must exist).',
    parameters: {
      path: { type: 'string', required: true, description: 'Absolute remote directory path.' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => text(value),
    },
    async execute(args, exec) {
      const conn = store.requireConnectedFor(sessionKeyOf(exec))
      await conn.mkdir((args as { path: string }).path, exec.signal)
      return '已创建目录'
    },
  }))

  tools.register(defineTool({
    name: 'ssh_rm',
    description: 'Delete one file or (empty) directory on this conversation\'s connected SSH server. Use with care — this is not reversible.',
    parameters: {
      path: { type: 'string', required: true, description: 'Absolute remote path to delete.' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => text(value),
    },
    async execute(args, exec) {
      const conn = store.requireConnectedFor(sessionKeyOf(exec))
      await conn.unlink((args as { path: string }).path, exec.signal)
      return '已删除'
    },
  }))

  tools.register(defineTool({
    name: 'ssh_exec',
    description:
      'Run one shell command on this conversation\'s connected SSH server and return its exit code plus captured stdout/stderr. The remote login shell parses the command (POSIX syntax on typical servers). Use this for work ssh_list/ssh_read/ssh_write cannot do (git, package managers, scripts).',
    parameters: {
      command: { type: 'string', required: true, description: 'The command line to run remotely.' },
      cwd: { type: 'string', description: 'Optional remote working directory to cd into first.' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => text(value),
    },
    async execute(args, exec) {
      const conn = store.requireConnectedFor(sessionKeyOf(exec))
      const input = args as { command: string; cwd?: string }
      const outcome = await conn.exec(
        input.command,
        // exactOptionalPropertyTypes: omit cwd rather than passing undefined.
        input.cwd !== undefined
          ? { cwd: input.cwd, maxChars: caps.execMaxChars }
          : { maxChars: caps.execMaxChars },
        exec.signal,
      )
      const lines = [`$ ${input.cwd !== undefined ? `cd ${input.cwd} && ` : ''}${input.command}`]
      if (outcome.stdout !== '') lines.push(outcome.stdout)
      if (outcome.stderr !== '') lines.push(`[stderr]\n${outcome.stderr}`)
      lines.push(outcome.code === 0
        ? '[exit 0]'
        : `[exit ${String(outcome.code)}] — 命令非零退出，请检查上面的错误输出`)
      return lines.join('\n')
    },
  }))

  ctx.systemPrompt.section({
    name: 'tool:ssh-files',
    order: 100,
    text:
      'SSH 工具（ssh_status / ssh_connect / ssh_list / ssh_read / ssh_write / ssh_mkdir / ssh_rm / ssh_exec）作用于本对话各自记住的服务器，与会话隔离：每个对话独立连接、互不影响。'
      + '需要操作远程服务器时，先 ssh_status 查看可用服务器，再 ssh_connect 连接（或沿用本会话已连的），然后使用 ssh_* 工具。本地文件仍用 read/write 等内置工具。',
  })
}
