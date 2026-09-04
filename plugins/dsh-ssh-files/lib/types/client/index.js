import { SshFilesPanel } from "./panel.js";
import { en, zh } from "./locales.js";
/** Dictionary namespace owned by this plugin. */
const NS = 'ssh-files';
/** The RPC channel this plugin's host half mounts. */
const RPC_CHANNEL = '/ssh-files';
/** Validate one wire server record. */
function parseServer(value) {
    if (typeof value !== 'object' || value === null)
        throw new Error('ssh-files: malformed server record');
    const record = value;
    if (typeof record.id !== 'string' || typeof record.name !== 'string'
        || typeof record.host !== 'string' || typeof record.port !== 'number'
        || typeof record.username !== 'string'
        || (record.auth !== 'password' && record.auth !== 'key' && record.auth !== 'agent')
        || typeof record.root !== 'string') {
        throw new Error('ssh-files: malformed server record');
    }
    const server = {
        id: record.id, name: record.name, host: record.host, port: record.port,
        username: record.username, auth: record.auth, root: record.root,
    };
    if (typeof record.password === 'string')
        server.password = record.password;
    if (typeof record.keyPath === 'string')
        server.keyPath = record.keyPath;
    return server;
}
/** Validate one wire state response (wire boundary: never trust the response shape). */
function parseStateResponse(value) {
    if (typeof value !== 'object' || value === null)
        throw new Error('ssh-files: malformed state response');
    const response = value;
    const state = response.state;
    if (typeof state !== 'object' || state === null)
        throw new Error('ssh-files: malformed state');
    const record = state;
    if (record.mode !== 'local' && record.mode !== 'ssh')
        throw new Error('ssh-files: malformed mode');
    if (typeof record.serverId !== 'string' && record.serverId !== null) {
        throw new Error('ssh-files: malformed server id');
    }
    if (typeof record.connected !== 'boolean')
        throw new Error('ssh-files: malformed connected flag');
    if (!Array.isArray(record.servers))
        throw new Error('ssh-files: malformed server list');
    const servers = record.servers.map(parseServer);
    const root = response.root === null || typeof response.root === 'string' ? response.root : null;
    return {
        state: {
            mode: record.mode,
            serverId: record.serverId,
            connected: record.connected,
            servers,
        },
        root,
    };
}
/** Validate one wire listing row. */
function parseEntry(value) {
    if (typeof value !== 'object' || value === null)
        throw new Error('ssh-files: malformed listing row');
    const { name, path, kind, hidden } = value;
    if (typeof name !== 'string' || typeof path !== 'string' || typeof hidden !== 'boolean') {
        throw new Error('ssh-files: malformed listing row');
    }
    if (kind !== 'dir' && kind !== 'file')
        throw new Error('ssh-files: malformed listing row');
    return { name, path, kind, hidden };
}
/** Validate one wire listing result. */
function parseListing(value) {
    if (typeof value !== 'object' || value === null)
        throw new Error('ssh-files: malformed listing response');
    const listing = value;
    if (typeof listing.path !== 'string' || !Array.isArray(listing.entries)) {
        throw new Error('ssh-files: malformed listing response');
    }
    return { path: listing.path, entries: listing.entries.map(parseEntry) };
}
/** Validate one wire read result. */
function parseRead(value) {
    if (typeof value !== 'object' || value === null)
        throw new Error('ssh-files: malformed read response');
    const content = value.content;
    if (typeof content !== 'string')
        throw new Error('ssh-files: malformed read response');
    return content;
}
/** Call one `/ssh-files` endpoint for one session, throwing on failure. */
async function rpcCall(connection, sessionId, endpoint, payload, signal) {
    const response = await connection.rpc.call(RPC_CHANNEL, endpoint, { ...payload, sessionId }, signal);
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
 * Register the mode-switching file panel once the layout's `details`
 * declaration is on the ledger. The inject face closes over `ctx`, so the
 * RPC calls stay live for the registration's whole lifetime.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    const connection = ctx.get('connection');
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ssh-files: dictionaries');
    ctx.slots.inject('details', () => ctx.slots.register({
        name: 'details',
        // Below the shipped DetailsPanel (0) and dsh-workspace-files (-1): the
        // lowest-priority entry renders, and the shadowed entries' child-slot
        // declarations stay live.
        priority: -2,
        locale: NS,
        inject: () => ({
            openDetails: () => { ctx.layout.openDetails(); },
            closeDetails: () => { ctx.layout.closeDetails(); },
            getState: (sessionId, signal) => rpcCall(connection, sessionId, 'get-state', {}, signal).then(parseStateResponse),
            setMode: (sessionId, mode) => rpcCall(connection, sessionId, 'set-mode', { mode }).then(parseStateResponse),
            addServer: (sessionId, input) => rpcCall(connection, sessionId, 'add-server', input).then(parseStateResponse),
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
                await rpcCall(connection, '', 'connect', { id: serverId });
                ctx.workspaces.startSession();
            },
            openLocalDefault: path => ctx.workspaces.openPath(path),
            openLocalCode: path => rpcCall(connection, '', 'open-local', { path, command: 'code' }).then(() => undefined),
            openLocalMarktext: path => rpcCall(connection, '', 'open-local', { path, command: 'marktext' }).then(() => undefined),
        }),
    }, SshFilesPanel));
}
//# sourceMappingURL=index.js.map