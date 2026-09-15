/**
 * `dsh-ssh-files` browser half: registers the right Sidebar's `ssh-files` tab
 * type — a page type reached from the sidebar guide whose body connects one
 * session to an SSH server and browses it. The shipped workspace tree owns the
 * local half of the story, so this panel is SSH-only. Every route call carries
 * the panel's session id, so the panel always reads and drives its own
 * conversation's SSH state.
 */
import type { ClientContext } from '@deepseek-ai/cordis'
import { IconFolderClose16 } from '@deepseek-ai/dsh-client-ui-primitives'
// Type-only: pulls the locale, slots, sidebar-right, and workspace Context merges.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
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
    /** The ssh-files sidebar tab copy. */
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

/** The route this plugin's host half mounts on the app's HTTP server. */
const ROUTE_PATH = '/ssh-files'

/**
 * Call one `/ssh-files` endpoint, throwing the host's message on failure.
 * @param sessionId - the session whose state the call reads or drives.
 * @param endpoint - route-relative endpoint name.
 * @param payload - endpoint-owned request payload.
 * @param signal - caller cancellation.
 * @returns the endpoint's response value.
 */
async function callRoute(
  sessionId: string, endpoint: string,
  payload: Record<string, unknown>, signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetch(`${ROUTE_PATH}/${endpoint}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...payload, sessionId }),
    ...(signal === undefined ? {} : { signal }),
  })
  if (!response.ok) throw new Error(`ssh-files: ${endpoint} failed with HTTP ${response.status}`)
  const result = await response.json() as { ok?: unknown, value?: unknown, error?: { message?: unknown } }
  if (result.ok !== true) {
    const message = typeof result.error?.message === 'string'
      ? result.error.message
      : `ssh-files: ${endpoint} failed`
    throw new Error(message)
  }
  return result.value
}

/**
 * Required services (cordis fiber inject): the slot registry, the locale
 * service, the right-Sidebar tab-type registry, and the workspace navigation
 * face (opening a new conversation on a server). Route calls ride the page's
 * own `fetch`, so the connection transport needs no injection here.
 */
export const inject = ['slots', 'locale', 'sidebarRightTabs', 'uiWorkspace']

/** This implementation's identity in the tab system, and the key its body registers under. */
const TAB_ID = '@deepseek-ai/dsh-ssh-files'

/** The page kind the guide entry opens. */
const TAB_KIND = 'ssh-files'

/**
 * Register the tab type, its dictionary, and its body on the right Sidebar's
 * keyed seat. The inject face closes over `ctx`, so the route calls stay live
 * for the registration's whole lifetime.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ssh-files: dictionaries')
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: TAB_ID,
    kind: TAB_KIND,
    title: () => t('tab.title'),
    guide: [{
      order: 30,
      title: () => t('tab.title'),
      description: () => t('guide.description'),
      icon: IconFolderClose16,
    }],
  }), 'ssh-files: tab type')
  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab',
    key: TAB_ID,
    locale: NS,
    inject: (): SshFilesInjected => ({
      getState: (sessionId, signal) => callRoute(sessionId, 'get-state', {}, signal).then(parseStateResponse),
      setMode: (sessionId, mode) => callRoute(sessionId, 'set-mode', { mode }).then(parseStateResponse),
      addServer: (sessionId, input) => callRoute(sessionId, 'add-server', input as unknown as Record<string, unknown>).then(parseStateResponse),
      updateServer: (sessionId, id, input) => callRoute(sessionId, 'update-server', { id, server: input }).then(parseStateResponse),
      removeServer: (sessionId, id) => callRoute(sessionId, 'remove-server', { id }).then(parseStateResponse),
      connect: (sessionId, id, signal) => callRoute(sessionId, 'connect', { id }, signal).then(parseStateResponse),
      disconnect: sessionId => callRoute(sessionId, 'disconnect', {}).then(parseStateResponse),
      list: (sessionId, path, signal) => callRoute(sessionId, 'list', { path }, signal).then(parseListing),
      read: (sessionId, path, signal) => callRoute(sessionId, 'read', { path }, signal).then(parseRead),
      write: (sessionId, path, content) => callRoute(sessionId, 'write', { path, content }).then(() => undefined),
      mkdir: (sessionId, path) => callRoute(sessionId, 'mkdir', { path }).then(() => undefined),
      unlink: (sessionId, path) => callRoute(sessionId, 'unlink', { path }).then(() => undefined),
      // Open the current workspace's New-Session view on this server: connect
      // first (also records it as the session default), then start a session,
      // which inherits that default (reusing the workspace's blank session
      // when one exists, per core semantics) and the panel auto-connects on
      // mount.
      openNewSessionOn: async (serverId) => {
        await callRoute('', 'connect', { id: serverId })
        ctx.uiWorkspace.startSession()
      },
      openLocalDefault: path => callRoute('', 'open-local', { path, command: 'default' }).then(() => undefined),
      openLocalCode: path => callRoute('', 'open-local', { path, command: 'code' }).then(() => undefined),
      openLocalMarktext: path => callRoute('', 'open-local', { path, command: 'marktext' }).then(() => undefined),
    }),
  }, SshFilesPanel)), 'ssh-files: tab body')
}
