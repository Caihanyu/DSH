/**
 * Durable `dsh-ssh-files` state, persisted as JSON under the harness home
 * (`~/.dsh/ssh-files/state.json`): a shared pool of saved server records plus
 * a working-mode preference per session (keyed by session id), so separate
 * conversations can each remember their own local/SSH choice and server
 * without touching each other. Brand-new sessions inherit the most recent
 * choice (`defaultPref`). The file is plugin-owned user data, never part of a
 * profile patch or a bundle, so harness updates cannot touch it.
 * @module @deepseek-ai/dsh-ssh-files/state
 */
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { dshHomePath } from '@deepseek-ai/dsh-home-paths';
/** Directory and file names under the harness home. */
const STATE_DIR = 'ssh-files';
const STATE_FILE = 'state.json';
/** Absolute path of the state file. */
export function stateFilePath() {
    return dshHomePath(STATE_DIR, STATE_FILE);
}
/** A fresh unique server record id. */
export function createServerId() {
    return randomUUID();
}
/** Default field values for a new server record. */
export function defaultServer() {
    return {
        name: '',
        host: '',
        port: 22,
        username: '',
        auth: 'password',
        root: '',
    };
}
/** A fresh local-mode, no-server preference. */
export function freshPref() {
    return { mode: 'local', serverId: null };
}
/**
 * The preference a session starts from: its own durable one when present,
 * else the shared most-recent default. Returns a copy — callers mutate and
 * persist through the store, never the durable object in place.
 * @param state - current durable state.
 * @param sessionId - session key; `undefined`/empty means a brand-new session.
 */
export function prefFor(state, sessionId) {
    const own = sessionId === undefined || sessionId === '' ? undefined : state.sessions[sessionId];
    return { ...(own ?? state.defaultPref) };
}
/** Validate one decoded record; returns it or `undefined` when malformed. */
function parseServer(value) {
    if (typeof value !== 'object' || value === null)
        return undefined;
    const record = value;
    const id = record.id;
    const name = record.name;
    const host = record.host;
    const port = record.port;
    const username = record.username;
    const auth = record.auth;
    const root = record.root;
    if (typeof id !== 'string' || id.length === 0)
        return undefined;
    if (typeof name !== 'string' || typeof host !== 'string' || host.length === 0)
        return undefined;
    if (typeof port !== 'number' || !Number.isInteger(port) || port < 1 || port > 65535)
        return undefined;
    if (typeof username !== 'string')
        return undefined;
    if (auth !== 'password' && auth !== 'key' && auth !== 'agent')
        return undefined;
    const server = {
        id,
        name,
        host,
        port,
        username,
        auth,
        root: typeof root === 'string' ? root : '',
    };
    if (typeof record.password === 'string')
        server.password = record.password;
    if (typeof record.keyPath === 'string')
        server.keyPath = record.keyPath;
    return server;
}
/** Parse one decoded preference object; falls back to local/no-server. */
function parsePref(value) {
    if (typeof value !== 'object' || value === null)
        return freshPref();
    const record = value;
    const mode = record.mode === 'ssh' ? 'ssh' : 'local';
    const serverId = typeof record.serverId === 'string' && record.serverId.length > 0
        ? record.serverId
        : (typeof record.activeServerId === 'string' && record.activeServerId.length > 0
            ? record.activeServerId
            : null);
    return { mode, serverId };
}
/**
 * Parse a decoded state file, migrating the v1 shape (a single global
 * `mode`/`activeServerId`) into the v2 default preference. Malformed rows are
 * dropped rather than failing the whole boot (the file is best-effort user
 * data), and an unreadable file is treated as fresh state.
 * @param raw - the raw JSON text of the state file.
 * @returns the validated state, always structurally sound.
 */
export function parseState(raw) {
    let decoded;
    const fresh = () => ({ servers: [], defaultPref: freshPref(), sessions: {} });
    try {
        decoded = JSON.parse(raw);
    }
    catch {
        return fresh();
    }
    if (typeof decoded !== 'object' || decoded === null)
        return fresh();
    const state = decoded;
    const servers = Array.isArray(state.servers)
        ? state.servers.map(parseServer).filter((server) => server !== undefined)
        : [];
    // v2: defaultPref + per-session map.
    if (state.defaultPref !== undefined || state.sessions !== undefined) {
        return {
            servers,
            defaultPref: parsePref(state.defaultPref),
            sessions: (() => {
                if (typeof state.sessions !== 'object' || state.sessions === null)
                    return {};
                const out = {};
                for (const [key, value] of Object.entries(state.sessions)) {
                    if (key.length > 0 && key !== '__proto__')
                        out[key] = parsePref(value);
                }
                return out;
            })(),
        };
    }
    // v1: a single global mode/activeServerId becomes the new-session default.
    return {
        servers,
        defaultPref: parsePref(state),
        sessions: {},
    };
}
/** Load the persisted state; a missing or unreadable file means fresh state. */
export async function loadState() {
    try {
        const raw = await readFile(stateFilePath(), 'utf8');
        return parseState(raw);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return { servers: [], defaultPref: freshPref(), sessions: {} };
        }
        throw error;
    }
}
/** Persist the state file atomically (temp + rename under the same directory). */
export async function saveState(state) {
    const file = stateFilePath();
    await mkdir(dirname(file), { recursive: true });
    const tmp = `${file}.tmp-${process.pid}`;
    await writeFile(tmp, JSON.stringify(state, undefined, 2) + '\n', 'utf8');
    await renameFile(tmp, file);
}
/** Cross-platform atomic rename (Windows rename cannot overwrite). */
async function renameFile(from, to) {
    try {
        await rename(from, to);
    }
    catch (error) {
        if (error.code !== 'EEXIST' && error.code !== 'EPERM')
            throw error;
        await unlink(to);
        await rename(from, to);
    }
}
//# sourceMappingURL=state.js.map