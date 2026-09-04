import { WorkspaceFilesPanel } from "./panel.js";
import { en, zh } from "./locales.js";
/** Dictionary namespace owned by this plugin. */
const NS = 'workspace-files';
/** The RPC channel this plugin's host half mounts. */
const RPC_CHANNEL = '/workspace-files';
/** Validate one wire `list` result (wire boundary: never trust the response shape). */
function parseListing(value) {
    if (typeof value !== 'object' || value === null)
        throw new Error('workspace-files: malformed listing response');
    const listing = value;
    if (typeof listing.path !== 'string' || !Array.isArray(listing.entries)) {
        throw new Error('workspace-files: malformed listing response');
    }
    const entries = listing.entries;
    const rows = [];
    for (const entry of entries) {
        if (typeof entry !== 'object' || entry === null)
            throw new Error('workspace-files: malformed listing row');
        const row = entry;
        if (typeof row.name !== 'string' || typeof row.path !== 'string'
            || (row.kind !== 'dir' && row.kind !== 'file') || typeof row.hidden !== 'boolean') {
            throw new Error('workspace-files: malformed listing row');
        }
        rows.push({ name: row.name, path: row.path, kind: row.kind, hidden: row.hidden });
    }
    return { path: listing.path, entries: rows };
}
/** Call one `/workspace-files` endpoint, throwing the host's message on failure. */
async function rpcCall(connection, endpoint, payload, signal) {
    const response = await connection.rpc.call(RPC_CHANNEL, endpoint, payload, signal);
    if (!response.ok)
        throw new Error(response.error.message);
    return response.value;
}
/**
 * Required services (cordis fiber inject): the slot registry, the layout
 * panel face, the workspaces runtime (default-app open), the connection
 * transport, and the locale service.
 */
export const inject = ['slots', 'layout', 'workspaces', 'connection', 'locale'];
/**
 * Register the tabbed details panel once the layout's `details` declaration
 * is on the ledger. The inject face closes over `ctx`, so the openers stay
 * live for the registration's whole lifetime.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    const connection = ctx.get('connection');
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'workspace-files: dictionaries');
    ctx.slots.inject('details', () => ctx.slots.register({
        name: 'details',
        // Shadow the shipped DetailsPanel: lowest priority renders, and the
        // shadowed entry's `conversation.details.tool` declaration stays live.
        priority: -1,
        locale: NS,
        inject: () => ({
            openDetails: () => { ctx.layout.openDetails(); },
            closeDetails: () => { ctx.layout.closeDetails(); },
            list: (path, signal) => rpcCall(connection, 'list', { path }, signal)
                .then(parseListing),
            openPath: path => ctx.workspaces.openPath(path),
            openInCode: path => rpcCall(connection, 'open-in-code', { path })
                .then(() => undefined),
            openInMarktext: path => rpcCall(connection, 'open-in-marktext', { path })
                .then(() => undefined),
        }),
    }, WorkspaceFilesPanel));
}
//# sourceMappingURL=index.js.map