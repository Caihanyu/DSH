/**
 * `dsh-ssh-files` browser half: occupies the layout's `details` slot with the
 * mode-switching file panel (local workspace ↔ connected SSH server). Registers
 * at a priority below the shipped DetailsPanel and `dsh-workspace-files` so it
 * renders first without removing them — the shadowed entries keep their child
 * slot declarations live. Every RPC call carries the panel's session id, so
 * the panel always reflects and drives its own conversation's SSH state.
 */
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale and layout Context merges (ctx.locale / ctx.layout).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { SshFilesPanel } from './panel.tsx'
import type {
  SshFilesInjected, SshListing, SshServer, SshStateResponse,
} from './contract.ts'
import { en, zh, type SshFilesKey } from './locales.ts'

export type {
  SshAuth, SshFileEntry, SshFilesInjected, SshFilesPanelProps, SshListing,
  SshMode, SshPanelState, SshServer, SshServerInput, SshStateResponse,
} from './contract.ts'
export type { SshFilesKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The ssh-files details panel copy. */
    'ssh-files': SshFilesKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'ssh-files'

/** The RPC channel this plugin's host half mounts. */
const RPC_CHANNEL = '/ssh-files'

/** Validate one wire server record. */
function parseServer(value: unknown): SshServer {
  if (typeof value !== 'object' || value === null) throw new Error('ssh-files: malformed server record')
  const record = value as Record<string, unknown>
  if (typeof record.id !== 'string' || typeof record.name !== 'string'
    || typeof record.host !== 'string' || typeof record.port !== 'number'
    || typeof record.username !== 'string'
    || (record.auth !== 'password' && record.auth !== 'key' && record.auth !== 'agent')
    || typeof record.root !== 'string') {
    throw new Error('ssh-files: malformed server record')
  }
  const server: SshServer = {
    id: record.id, name: record.name, host: record.host, port: record.port,
    username: record.username, auth: record.auth, root: record.root,
  }
  if (typeof record.password === 'string') server.password = record.password
  if (typeof record.keyPath === 'string') server.keyPath = record.keyPath
  return server
}

/** Validate one wire state response (wire boundary: never trust the response shape). */
function parseStateResponse(value: unknown): SshStateResponse {
  if (typeof value !== 'object' || value === null) throw new Error('ssh-files: malformed state response')
  const response = value as { state?: unknown; root?: unknown }
  const state = response.state
  if (typeof state !== 'object' || state === null) throw new Error('ssh-files: malformed state')
  const record = state as { mode?: unknown; serverId?: unknown; servers?: unknown; connected?: unknown }
  if (record.mode !== 'local' && record.mode !== 'ssh') throw new Error('ssh-files: malformed mode')
  if (typeof record.serverId !== 'string' && record.serverId !== null) {
    throw new Error('ssh-files: malformed server id')
  }
  if (typeof record.connected !== 'boolean') throw new Error('ssh-files: malformed connected flag')
  if (!Array.isArray(record.servers)) throw new Error('ssh-files: malformed server list')
  const servers = record.servers.map(parseServer)
  const root = response.root === null || typeof response.root === 'string' ? response.root : null
  return {
    state: {
      mode: record.mode,
      serverId: record.serverId,
      connected: record.connected,
      servers,
    },
    root,
  }
}

/** Validate one wire listing row. */
function parseEntry(value: unknown): import('./contract.ts').SshFileEntry {
  if (typeof value !== 'object' || value === null) throw new Error('ssh-files: malformed listing row')
  const { name, path, kind, hidden } = value as Record<string, unknown>
  if (typeof name !== 'string' || typeof path !== 'string' || typeof hidden !== 'boolean') {
    throw new Error('ssh-files: malformed listing row')
  }
  if (kind !== 'dir' && kind !== 'file') throw new Error('ssh-files: malformed listing row')
  return { name, path, kind, hidden }
}

/** Validate one wire listing result. */
function parseListing(value: unknown): SshListing {
  if (typeof value !== 'object' || value === null) throw new Error('ssh-files: malformed listing response')
  const listing = value as { path?: unknown; entries?: unknown }
  if (typeof listing.path !== 'string' || !Array.isArray(listing.entries)) {
    throw new Error('ssh-files: malformed listing response')
  }
  return { path: listing.path, entries: listing.entries.map(parseEntry) }
}

/** Validate one wire read result. */
function parseRead(value: unknown): string {
  if (typeof value !== 'object' || value === null) throw new Error('ssh-files: malformed read response')
  const content = (value as { content?: unknown }).content
  if (typeof content !== 'string') throw new Error('ssh-files: malformed read response')
  return content
}

/** Call one `/ssh-files` endpoint for one session, throwing on failure. */
async function rpcCall(
  connection: ConnectionHandle, sessionId: string, endpoint: string,
  payload: Record<string, unknown>, signal?: AbortSignal,
): Promise<unknown> {
  const response = await connection.rpc.call(
    RPC_CHANNEL, endpoint, { ...payload, sessionId }, signal,
  )
  if (!response.ok) throw new Error(response.error.message)
  return response.value
}

/**
 * Required services (cordis fiber inject): the slot registry, the layout
 * panel face, the workspaces runtime (default-app open), the connection
 * transport, and the locale service.
 */
export const inject = ['slots', 'layout', 'workspaces', 'connection', 'locale']

/**
 * Register the mode-switching file panel once the layout's `details`
 * declaration is on the ledger. The inject face closes over `ctx`, so the
 * RPC calls stay live for the registration's whole lifetime.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  const connection = ctx.get('connection') as ConnectionHandle
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ssh-files: dictionaries')
  ctx.slots.inject('details', () => ctx.slots.register({
    name: 'details',
    // Below the shipped DetailsPanel (0) and dsh-workspace-files (-1): the
    // lowest-priority entry renders, and the shadowed entries' child-slot
    // declarations stay live.
    priority: -2,
    locale: NS,
    inject: (): SshFilesInjected => ({
      openDetails: () => { ctx.layout.openDetails() },
      closeDetails: () => { ctx.layout.closeDetails() },
      getState: (sessionId, signal) => rpcCall(connection, sessionId, 'get-state', {}, signal).then(parseStateResponse),
      setMode: (sessionId, mode) => rpcCall(connection, sessionId, 'set-mode', { mode }).then(parseStateResponse),
      addServer: (sessionId, input) => rpcCall(connection, sessionId, 'add-server', input as unknown as Record<string, unknown>).then(parseStateResponse),
      updateServer: (sessionId, id, input) => rpcCall(connection, sessionId, 'update-server', { id, server: input }).then(parseStateResponse),
      removeServer: (sessionId, id) => rpcCall(connection, sessionId, 'remove-server', { id }).then(parseStateResponse),
      connect: (sessionId, id, signal) => rpcCall(connection, sessionId, 'connect', { id }, signal).then(parseStateResponse),
      disconnect: sessionId => rpcCall(connection, sessionId, 'disconnect', {}).then(parseStateResponse),
      list: (sessionId, path, signal) => rpcCall(connection, sessionId, 'list', { path }, signal).then(parseListing),
      read: (sessionId, path, signal) => rpcCall(connection, sessionId, 'read', { path }, signal).then(parseRead),
      write: (sessionId, path, content) => rpcCall(connection, sessionId, 'write', { path, content }).then(() => undefined),
      mkdir: (sessionId, path) => rpcCall(connection, sessionId, 'mkdir', { path }).then(() => undefined),
      unlink: (sessionId, path) => rpcCall(connection, sessionId, 'unlink', { path }).then(() => undefined),
      // Open the current workspace's New-Session view on this server: connect
      // first (also records it as the session default), then start a session,
      // which inherits that default (reusing the workspace's blank session
      // when one exists, per core semantics) and the panel auto-connects on
      // mount.
      openNewSessionOn: async (serverId) => {
        await rpcCall(connection, '', 'connect', { id: serverId })
        ctx.workspaces.startSession()
      },
      openLocalDefault: path => ctx.workspaces.openPath(path),
      openLocalCode: path => rpcCall(connection, '', 'open-local', { path, command: 'code' }).then(() => undefined),
      openLocalMarktext: path => rpcCall(connection, '', 'open-local', { path, command: 'marktext' }).then(() => undefined),
    }),
  }, SshFilesPanel))
}
