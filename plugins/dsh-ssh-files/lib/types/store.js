/**
 * Session-scoped runtime store for `dsh-ssh-files`. One store instance owns
 * the durable state (shared server pool + per-session preferences) and a
 * live `SshConnection` per session key — separate conversations connect to
 * different servers and never share an SSH channel, which is the isolation
 * boundary between local and remote work. Both the `/ssh-files` RPC channel
 * and the model-facing `ssh_*` tools route through this store.
 * @module @deepseek-ai/dsh-ssh-files/store
 */
import { mkdir, readdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SshConnection } from "./ssh.js";
import { createServerId, freshPref, loadState, prefFor, saveState, } from "./state.js";
/** One local directory listing (mirrors the remote listing shape). */
async function listLocal(path) {
    const dirents = await readdir(path, { withFileTypes: true });
    const entries = [];
    for (const dirent of dirents) {
        let kind;
        if (dirent.isDirectory()) {
            kind = 'dir';
        }
        else if (dirent.isFile() || dirent.isSymbolicLink()) {
            kind = 'file';
        }
        else {
            continue;
        }
        entries.push({
            name: dirent.name,
            path: join(path, dirent.name),
            kind,
            hidden: dirent.name.startsWith('.'),
        });
    }
    entries.sort((a, b) => a.kind === b.kind
        ? a.name.localeCompare(b.name)
        : a.kind === 'dir' ? -1 : 1);
    return { path, entries };
}
/** Read one local text file with the same size/binary caps as the remote read. */
async function readLocal(path, maxBytes) {
    const stats = await stat(path);
    if (stats.isDirectory())
        throw new Error('这是一个目录，请展开后选择文件');
    if (stats.size > maxBytes) {
        throw new Error(`文件过大（${stats.size} 字节，超过 ${maxBytes} 字节上限），无法在面板中编辑`);
    }
    const text = await readFile(path, 'utf8');
    if (text.includes('\0'))
        throw new Error('检测到二进制内容，无法以文本方式编辑');
    return text;
}
/** Write one local file atomically (temp + rename). */
async function writeLocal(path, content) {
    const tmp = `${path}.dsh-edit-${process.pid}-${Date.now()}`;
    try {
        await writeFile(tmp, content, 'utf8');
        await rename(tmp, path);
    }
    catch (error) {
        try {
            await unlink(tmp);
        }
        catch { /* best-effort cleanup */ }
        throw error;
    }
}
/** Create one local directory. */
async function mkdirLocal(path) {
    await mkdir(path, { recursive: false });
}
/** Delete one local file or (empty) directory. */
async function unlinkLocal(path) {
    const stats = await stat(path);
    if (stats.isDirectory()) {
        const { rmdir } = await import('node:fs/promises');
        await rmdir(path);
    }
    else {
        await unlink(path);
    }
}
/** The server record for a prefs serverId, or undefined when stale. */
function serverOf(state, serverId) {
    if (serverId === null)
        return undefined;
    return state.servers.find(candidate => candidate.id === serverId);
}
/**
 * The session-scoped store: durable state plus one live SSH connection per
 * session key. Every preference write persists before returning; connection
 * state is intentionally memory-only (a restart requires reconnecting).
 */
export class SshSessionStore {
    opTimeoutMs;
    ready;
    state = null;
    runtimes = new Map();
    /**
     * @param opTimeoutMs - deadline for one remote SFTP round trip; passed to
     *   every per-session {@link SshConnection} (see its constructor).
     */
    constructor(opTimeoutMs = 120000) {
        this.opTimeoutMs = opTimeoutMs;
        // Load once; a corrupt file falls back to defaults rather than failing boot.
        this.ready = loadState().then((state) => { this.state = state; }, () => { this.state = { servers: [], defaultPref: freshPref(), sessions: {} }; });
    }
    /** Wait for the initial load and return the current state. */
    async current() {
        await this.ready;
        const state = this.state;
        if (state === null)
            throw new Error('ssh-files: state failed to initialize');
        return state;
    }
    /** Persist the current state. */
    async persist() {
        const state = this.state;
        if (state === null)
            throw new Error('ssh-files: state failed to initialize');
        await saveState(state);
    }
    /** The runtime for a session key (created lazily, never shared across keys). */
    runtimeFor(sessionId) {
        let runtime = this.runtimes.get(sessionId);
        if (runtime === undefined) {
            runtime = { conn: new SshConnection(this.opTimeoutMs) };
            this.runtimes.set(sessionId, runtime);
        }
        return runtime;
    }
    /** Write a session's durable preference (both its own row and the default). */
    async writePref(sessionId, pref) {
        const state = await this.current();
        if (sessionId !== '')
            state.sessions[sessionId] = { ...pref };
        state.defaultPref = { ...pref };
        await this.persist();
    }
    /** The effective tree root for a connected session's server. */
    async rootFor(state, sessionId) {
        const runtime = this.runtimeFor(sessionId);
        const server = serverOf(state, prefFor(state, sessionId === '' ? undefined : sessionId).serverId);
        if (server !== undefined && server.root.trim() !== '')
            return server.root;
        return runtime.conn.activeHome ?? '/';
    }
    /** The full wire state response for one session. */
    async response(sessionId) {
        const state = await this.current();
        const pref = prefFor(state, sessionId === '' ? undefined : sessionId);
        const runtime = this.runtimeFor(sessionId);
        const connected = runtime.conn.connected;
        const root = connected ? await this.rootFor(state, sessionId) : null;
        return {
            state: {
                mode: pref.mode,
                serverId: pref.serverId,
                servers: state.servers,
                connected,
            },
            root,
        };
    }
    /** Switch one session's working mode (also remembered as the default). */
    async setMode(sessionId, mode) {
        const state = await this.current();
        const pref = prefFor(state, sessionId === '' ? undefined : sessionId);
        await this.writePref(sessionId, { mode, serverId: pref.serverId });
        return this.response(sessionId);
    }
    /** Add a server record (id generated, shared by every session). */
    async addServer(input, sessionId = '') {
        const state = await this.current();
        state.servers.push({ ...input, id: createServerId() });
        await this.persist();
        return this.response(sessionId);
    }
    /** Replace one server record's fields. */
    async updateServer(id, input, sessionId = '') {
        const state = await this.current();
        const index = state.servers.findIndex(candidate => candidate.id === id);
        const previous = state.servers[index];
        if (previous === undefined)
            throw new Error('服务器记录不存在');
        state.servers[index] = { ...input, id: previous.id };
        await this.persist();
        return this.response(sessionId);
    }
    /** Remove one server record, dropping connections and prefs that target it. */
    async removeServer(id, sessionId = '') {
        const state = await this.current();
        const index = state.servers.findIndex(candidate => candidate.id === id);
        if (index === -1)
            throw new Error('服务器记录不存在');
        state.servers.splice(index, 1);
        // Every session that pointed at this server forgets it; its live
        // connection (if any) is torn down so the channel is never reused.
        for (const [runtimeSessionId, runtime] of this.runtimes) {
            if (runtime.conn.activeServer?.id !== id)
                continue;
            await runtime.conn.disconnect();
            const pref = prefFor(state, runtimeSessionId === '' ? undefined : runtimeSessionId);
            if (pref.serverId === id && runtimeSessionId !== '') {
                state.sessions[runtimeSessionId] = { ...pref, serverId: null };
            }
        }
        if (state.defaultPref.serverId === id)
            state.defaultPref = { ...state.defaultPref, serverId: null };
        await this.persist();
        return this.response(sessionId);
    }
    /** Connect one session to a saved server; its mode becomes `ssh`. */
    async connect(sessionId, id, timeoutMs, signal) {
        const state = await this.current();
        const server = state.servers.find(candidate => candidate.id === id);
        if (server === undefined)
            throw new Error('服务器记录不存在');
        const runtime = this.runtimeFor(sessionId);
        const result = await runtime.conn.connect(server, timeoutMs, signal);
        await this.writePref(sessionId, { mode: 'ssh', serverId: id });
        return {
            state: { mode: 'ssh', serverId: id, servers: state.servers, connected: true },
            root: result.root,
        };
    }
    /** Tear down one session's live connection (its preference is kept). */
    async disconnect(sessionId) {
        const state = await this.current();
        const runtime = this.runtimeFor(sessionId);
        await runtime.conn.disconnect();
        const pref = prefFor(state, sessionId === '' ? undefined : sessionId);
        return {
            state: { mode: pref.mode, serverId: pref.serverId, servers: state.servers, connected: false },
            root: null,
        };
    }
    /** Resolve a server reference (id or display name) to a record. */
    findServer(state, reference) {
        if (reference === undefined || reference === '')
            return undefined;
        return state.servers.find(candidate => candidate.id === reference)
            ?? state.servers.find(candidate => candidate.name === reference);
    }
    /** The connected server of one session, throwing when not connected. */
    requireServer(sessionId) {
        const state = this.state;
        if (state === null)
            throw new Error('ssh-files: state failed to initialize');
        const runtime = this.runtimeFor(sessionId);
        const server = runtime.conn.activeServer;
        if (server === null)
            throw new Error('本会话尚未连接服务器：请先用 ssh_connect 连接（或右侧面板连接）');
        return server;
    }
    /**
     * Ensure one session is connected to a target server (its reference or the
     * session's remembered server), then return the runtime's connection.
     * @param sessionId - session key.
     * @param reference - server id or name; omitted uses the session's remembered server.
     */
    async ensureConnected(sessionId, reference, timeoutMs, signal) {
        const state = await this.current();
        const runtime = this.runtimeFor(sessionId);
        const active = runtime.conn.activeServer;
        const wanted = reference === undefined || reference === ''
            ? serverOf(state, prefFor(state, sessionId === '' ? undefined : sessionId).serverId)
            : this.findServer(state, reference);
        if (active !== null && (wanted === undefined || active.id === wanted.id)) {
            return { conn: runtime.conn, server: active };
        }
        if (wanted === undefined) {
            throw new Error('找不到目标服务器：请提供已保存服务器的 id 或名称（ssh_status 可列出）');
        }
        await runtime.conn.connect(wanted, timeoutMs, signal);
        await this.writePref(sessionId, { mode: 'ssh', serverId: wanted.id });
        return { conn: runtime.conn, server: wanted };
    }
    /** Mode-aware directory listing for one session (panel behavior). */
    async list(sessionId, path, signal) {
        const state = await this.current();
        const pref = prefFor(state, sessionId === '' ? undefined : sessionId);
        if (pref.mode !== 'ssh')
            return listLocal(path);
        const runtime = this.runtimeFor(sessionId);
        if (!runtime.conn.connected)
            throw new Error('SSH 模式下请先连接服务器');
        return runtime.conn.list(path, signal);
    }
    /** Mode-aware text read with the configured size cap. */
    async read(sessionId, path, maxBytes, signal) {
        const state = await this.current();
        const pref = prefFor(state, sessionId === '' ? undefined : sessionId);
        if (pref.mode !== 'ssh')
            return readLocal(path, maxBytes);
        const runtime = this.runtimeFor(sessionId);
        if (!runtime.conn.connected)
            throw new Error('SSH 模式下请先连接服务器');
        return runtime.conn.read(path, maxBytes, signal);
    }
    /** Mode-aware atomic text write. */
    async write(sessionId, path, content, signal) {
        const state = await this.current();
        const pref = prefFor(state, sessionId === '' ? undefined : sessionId);
        if (pref.mode !== 'ssh')
            return writeLocal(path, content);
        const runtime = this.runtimeFor(sessionId);
        if (!runtime.conn.connected)
            throw new Error('SSH 模式下请先连接服务器');
        return runtime.conn.write(path, content, signal);
    }
    /** Mode-aware directory creation. */
    async mkdir(sessionId, path, signal) {
        const state = await this.current();
        const pref = prefFor(state, sessionId === '' ? undefined : sessionId);
        if (pref.mode !== 'ssh')
            return mkdirLocal(path);
        const runtime = this.runtimeFor(sessionId);
        if (!runtime.conn.connected)
            throw new Error('SSH 模式下请先连接服务器');
        return runtime.conn.mkdir(path, signal);
    }
    /** Mode-aware file/directory deletion. */
    async unlink(sessionId, path, signal) {
        const state = await this.current();
        const pref = prefFor(state, sessionId === '' ? undefined : sessionId);
        if (pref.mode !== 'ssh')
            return unlinkLocal(path);
        const runtime = this.runtimeFor(sessionId);
        if (!runtime.conn.connected)
            throw new Error('SSH 模式下请先连接服务器');
        return runtime.conn.unlink(path, signal);
    }
    /** The live connection of one session (must be connected first). */
    connection(sessionId) {
        return this.runtimeFor(sessionId).conn;
    }
    /** The connected connection of one session, throwing when not connected. */
    requireConnectedFor(sessionId) {
        const runtime = this.runtimeFor(sessionId);
        if (!runtime.conn.connected) {
            throw new Error('本会话尚未连接服务器：请先用 ssh_connect 连接（或右侧面板连接）');
        }
        return runtime.conn;
    }
    /** Tear down every live connection (host teardown). */
    async dispose() {
        await Promise.all([...this.runtimes.values()].map(runtime => runtime.conn.disconnect()));
        this.runtimes.clear();
    }
}
//# sourceMappingURL=store.js.map