/**
 * `dsh-workspace-files` browser half: occupies the layout's `details` slot
 * with the tabbed workspace-file panel. Registers at a negative priority to
 * shadow the shipped DetailsPanel (the cell's lowest-priority entry renders)
 * without removing it — the shadowed entry keeps its
 * `conversation.details.tool` declaration live, so ui-tool's tool-details
 * registrations stay bound. The panel reads the current session's workspace
 * root through the standard `useSessions` seat and opens files through the
 * `/workspace-files` channel (VS Code / MarkText) or the existing
 * `host.openPath` (default app).
 */
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale and layout Context merges (ctx.locale / ctx.layout).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { WorkspaceFilesPanel } from './panel.tsx'
import type { WorkspaceFilesInjected, WorkspaceFilesListing } from './contract.ts'
import { en, zh, type WorkspaceFilesKey } from './locales.ts'

export type {
  WorkspaceFilesEntry, WorkspaceFilesInjected, WorkspaceFilesListing, WorkspaceFilesPanelProps,
} from './contract.ts'
export type { WorkspaceFilesKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The workspace-files details panel copy. */
    'workspace-files': WorkspaceFilesKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'workspace-files'

/** The RPC channel this plugin's host half mounts. */
const RPC_CHANNEL = '/workspace-files'

/** Validate one wire `list` result (wire boundary: never trust the response shape). */
function parseListing(value: unknown): WorkspaceFilesListing {
  if (typeof value !== 'object' || value === null) throw new Error('workspace-files: malformed listing response')
  const listing = value as { path?: unknown; entries?: unknown }
  if (typeof listing.path !== 'string' || !Array.isArray(listing.entries)) {
    throw new Error('workspace-files: malformed listing response')
  }
  const entries = listing.entries as unknown[]
  const rows: WorkspaceFilesListing['entries'] = []
  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null) throw new Error('workspace-files: malformed listing row')
    const row = entry as { name?: unknown; path?: unknown; kind?: unknown; hidden?: unknown }
    if (typeof row.name !== 'string' || typeof row.path !== 'string'
      || (row.kind !== 'dir' && row.kind !== 'file') || typeof row.hidden !== 'boolean') {
      throw new Error('workspace-files: malformed listing row')
    }
    rows.push({ name: row.name, path: row.path, kind: row.kind, hidden: row.hidden })
  }
  return { path: listing.path, entries: rows }
}

/** Call one `/workspace-files` endpoint, throwing the host's message on failure. */
async function rpcCall(connection: ConnectionHandle, endpoint: string, payload: unknown, signal?: AbortSignal): Promise<unknown> {
  const response = await connection.rpc.call(RPC_CHANNEL, endpoint, payload, signal)
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
 * Register the tabbed details panel once the layout's `details` declaration
 * is on the ledger. The inject face closes over `ctx`, so the openers stay
 * live for the registration's whole lifetime.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  const connection = ctx.get('connection') as ConnectionHandle
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'workspace-files: dictionaries')
  ctx.slots.inject('details', () => ctx.slots.register({
    name: 'details',
    // Shadow the shipped DetailsPanel: lowest priority renders, and the
    // shadowed entry's `conversation.details.tool` declaration stays live.
    priority: -1,
    locale: NS,
    inject: (): WorkspaceFilesInjected => ({
      openDetails: () => { ctx.layout.openDetails() },
      closeDetails: () => { ctx.layout.closeDetails() },
      list: (path, signal) => rpcCall(connection, 'list', { path }, signal)
        .then(parseListing),
      openPath: path => ctx.workspaces.openPath(path),
      openInCode: path => rpcCall(connection, 'open-in-code', { path })
        .then(() => undefined),
      openInMarktext: path => rpcCall(connection, 'open-in-marktext', { path })
        .then(() => undefined),
    }),
  }, WorkspaceFilesPanel))
}
