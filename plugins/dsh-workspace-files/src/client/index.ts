/**
 * `dsh-workspace-files` browser half: takes over the right Sidebar's shipped
 * `files` tab type and fills it with this plugin's workspace file tree — the
 * current session's directory, with per-category openers (Markdown → the first
 * available of Typora / MarkText, code → VS Code, anything else → the default
 * application) and sidebar previews. The tree reads the session's root through
 * the standard `useSessions` seat and calls the plugin's own
 * `/workspace-files` route.
 */
import type { ClientContext } from '@deepseek-ai/cordis'
import { IconFolderClose16 } from '@deepseek-ai/dsh-client-ui-primitives'
// Type-only: pulls the locale, slots, sidebar-right, and workspace Context merges.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import { WorkspaceFilesPanel } from './panel.tsx'
import type {
  FoundApp, ScanResult, WorkspaceFilesInjected, WorkspaceFilesListing, WorkspaceFilesState,
} from './contract.ts'
import { en, zh, type WorkspaceFilesKey } from './locales.ts'

export type {
  AppEntry, AppSlot, FoundApp, ScanResult, SetupStatus, WorkspaceFilesEntry, WorkspaceFilesInjected,
  WorkspaceFilesListing, WorkspaceFilesPanelProps, WorkspaceFilesState,
} from './contract.ts'
export type { WorkspaceFilesKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The workspace-files sidebar tab copy. */
    'workspace-files': WorkspaceFilesKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'workspace-files'

/** The route this plugin's host half mounts on the app's HTTP server. */
const ROUTE_PATH = '/workspace-files'

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

/** Validate one wire `state` result (wire boundary: never trust the response shape). */
function parseState(value: unknown): WorkspaceFilesState {
  if (typeof value !== 'object' || value === null) throw new Error('workspace-files: malformed state response')
  const record = value as { status?: unknown, apps?: unknown }
  if (record.status !== 'pending' && record.status !== 'ready' && record.status !== 'off') {
    throw new Error('workspace-files: malformed state status')
  }
  const apps: WorkspaceFilesState['apps'] = {}
  if (typeof record.apps === 'object' && record.apps !== null) {
    for (const slot of ['markdown', 'code', 'office'] as const) {
      const raw = (record.apps as Record<string, unknown>)[slot]
      if (typeof raw !== 'object' || raw === null) continue
      const entry = raw as Record<string, unknown>
      if (typeof entry.id !== 'string' || typeof entry.label !== 'string'
        || typeof entry.command !== 'string' || entry.command.length === 0) continue
      apps[slot] = { id: entry.id, label: entry.label, command: entry.command, enabled: entry.enabled === true }
    }
  }
  return { version: 1, status: record.status, apps }
}

/** Validate one wire `scan` result (wire boundary: never trust the response shape). */
function parseScanResult(value: unknown): ScanResult {
  if (typeof value !== 'object' || value === null) throw new Error('workspace-files: malformed scan response')
  const record = value as { found?: unknown, truncated?: unknown }
  if (!Array.isArray(record.found)) throw new Error('workspace-files: malformed scan response')
  const found: FoundApp[] = []
  for (const row of record.found as unknown[]) {
    if (typeof row !== 'object' || row === null) throw new Error('workspace-files: malformed scan row')
    const app = row as Record<string, unknown>
    if (typeof app.id !== 'string' || typeof app.label !== 'string' || typeof app.command !== 'string'
      || (app.slot !== 'markdown' && app.slot !== 'code' && app.slot !== 'office')) {
      throw new Error('workspace-files: malformed scan row')
    }
    const source = app.source
    if (source !== 'config' && source !== 'location' && source !== 'path'
      && source !== 'registry' && source !== 'scan') {
      throw new Error('workspace-files: malformed scan row source')
    }
    found.push({ id: app.id, slot: app.slot, label: app.label, command: app.command, source })
  }
  return { found, truncated: typeof record.truncated === 'string' ? record.truncated : '' }
}

/**
 * Call one `/workspace-files` endpoint, throwing the host's message on failure.
 * @param endpoint - route-relative endpoint name.
 * @param payload - endpoint-owned request payload.
 * @param signal - caller cancellation.
 * @returns the endpoint's response value.
 */
async function callRoute(endpoint: string, payload: unknown, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(`${ROUTE_PATH}/${endpoint}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
    ...(signal === undefined ? {} : { signal }),
  })
  const result = await response.json().catch(() => undefined) as
    | { ok?: unknown, value?: unknown, error?: { message?: unknown } }
    | undefined
  // A failed status still carries the host's own message, and that message
  // names the fix (a missing opener, a bad config value) far better than the
  // status code does — so prefer it over the generic HTTP wording.
  if (!response.ok) {
    throw new Error(typeof result?.error?.message === 'string'
      ? result.error.message
      : `workspace-files: ${endpoint} failed with HTTP ${response.status}`)
  }
  if (result?.ok !== true) {
    const message = typeof result?.error?.message === 'string'
      ? result.error.message
      : `workspace-files: ${endpoint} failed`
    throw new Error(message)
  }
  return result.value
}

/**
 * Required services (cordis fiber inject): the slot registry, the locale
 * service, and the right-Sidebar tab-type registry. The route calls ride the
 * page's own `fetch`, so the connection transport needs no injection here.
 */
export const inject = ['slots', 'locale', 'sidebarRightTabs']

/** This implementation's identity in the tab system, and the key its body registers under. */
const TAB_ID = '@deepseek-ai/dsh-workspace-files'

/**
 * The page kind this plugin owns: the shipped `files` kind. A kind carries one
 * builtin and one extension registration, and the extension is the one in
 * force — so registering here takes the shipped workspace file tree over, and
 * the sidebar shows this plugin's tree (with its VS Code / MarkText / default
 * app openers) instead of a second, near-identical entry.
 */
const TAB_KIND = 'files'

/**
 * Register the tab type, its dictionary, and its body on the right Sidebar's
 * keyed seat. The inject face closes over `ctx`, so the openers stay live for
 * the registration's whole lifetime.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'workspace-files: dictionaries')
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: TAB_ID,
    kind: TAB_KIND,
    title: () => t('panel.title'),
    guide: [{
      order: 20,
      title: () => t('panel.title'),
      description: () => t('guide.description'),
      icon: IconFolderClose16,
    }],
  }), 'workspace-files: tab type')
  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab',
    key: TAB_ID,
    locale: NS,
    inject: (): WorkspaceFilesInjected => ({
      list: (path, signal) => callRoute('list', { path }, signal)
        .then(parseListing),
      readState: signal => callRoute('state', {}, signal)
        .then(parseState),
      scanApps: (deep, signal) => callRoute('scan', { deep }, signal)
        .then(parseScanResult),
      saveState: state => callRoute('save', state, undefined)
        .then(parseState),
      openPath: path => callRoute('open-default', { path })
        .then(() => undefined),
      openInCode: path => callRoute('open-in-code', { path })
        .then(() => undefined),
      openInMarkdown: path => callRoute('open-in-markdown', { path })
        .then(() => undefined),
      openInOffice: path => callRoute('open-in-office', { path })
        .then(() => undefined),
    }),
  }, WorkspaceFilesPanel)), 'workspace-files: tab body')
}
