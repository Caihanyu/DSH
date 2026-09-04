/**
 * Session-scoped runtime store for `dsh-ssh-files`. One store instance owns
 * the durable state (shared server pool + per-session preferences) and a
 * live `SshConnection` per session key — separate conversations connect to
 * different servers and never share an SSH channel, which is the isolation
 * boundary between local and remote work. Both the `/ssh-files` RPC channel
 * and the model-facing `ssh_*` tools route through this store.
 * @module @deepseek-ai/dsh-ssh-files/store
 */
import { SshConnection, type SshListing } from './ssh.ts';
import { type SshMode, type SshServer, type SshState } from './state.ts';
/** The wire panel state for one session. */
export interface SshPanelState {
    /** This session's working mode. */
    mode: SshMode;
    /** This session's remembered server id (may be stale after restarts). */
    serverId: string | null;
    /** The shared saved-server pool. */
    servers: SshServer[];
    /** Whether this session has a live connection right now. */
    connected: boolean;
}
/** One wire state response: the session's state plus its effective tree root. */
export interface SshStateResponse {
    state: SshPanelState;
    /** The file tree's base when a server is connected; null otherwise. */
    root: string | null;
}
/** A validated add/update server payload (all fields, id generated on add). */
export type SshServerInput = Omit<SshServer, 'id'>;
/** A session key normalized to `''` when absent (direct RPC / no agent). */
export type SessionKey = string;
/**
 * The session-scoped store: durable state plus one live SSH connection per
 * session key. Every preference write persists before returning; connection
 * state is intentionally memory-only (a restart requires reconnecting).
 */
export declare class SshSessionStore {
    private readonly opTimeoutMs;
    private ready;
    private state;
    private readonly runtimes;
    /**
     * @param opTimeoutMs - deadline for one remote SFTP round trip; passed to
     *   every per-session {@link SshConnection} (see its constructor).
     */
    constructor(opTimeoutMs?: number);
    /** Wait for the initial load and return the current state. */
    private current;
    /** Persist the current state. */
    private persist;
    /** The runtime for a session key (created lazily, never shared across keys). */
    private runtimeFor;
    /** Write a session's durable preference (both its own row and the default). */
    private writePref;
    /** The effective tree root for a connected session's server. */
    private rootFor;
    /** The full wire state response for one session. */
    response(sessionId: SessionKey): Promise<SshStateResponse>;
    /** Switch one session's working mode (also remembered as the default). */
    setMode(sessionId: SessionKey, mode: SshMode): Promise<SshStateResponse>;
    /** Add a server record (id generated, shared by every session). */
    addServer(input: SshServerInput, sessionId?: SessionKey): Promise<SshStateResponse>;
    /** Replace one server record's fields. */
    updateServer(id: string, input: SshServerInput, sessionId?: SessionKey): Promise<SshStateResponse>;
    /** Remove one server record, dropping connections and prefs that target it. */
    removeServer(id: string, sessionId?: SessionKey): Promise<SshStateResponse>;
    /** Connect one session to a saved server; its mode becomes `ssh`. */
    connect(sessionId: SessionKey, id: string, timeoutMs: number, signal: AbortSignal): Promise<SshStateResponse>;
    /** Tear down one session's live connection (its preference is kept). */
    disconnect(sessionId: SessionKey): Promise<SshStateResponse>;
    /** Resolve a server reference (id or display name) to a record. */
    findServer(state: SshState, reference: string | undefined): SshServer | undefined;
    /** The connected server of one session, throwing when not connected. */
    requireServer(sessionId: SessionKey): SshServer;
    /**
     * Ensure one session is connected to a target server (its reference or the
     * session's remembered server), then return the runtime's connection.
     * @param sessionId - session key.
     * @param reference - server id or name; omitted uses the session's remembered server.
     */
    ensureConnected(sessionId: SessionKey, reference: string | undefined, timeoutMs: number, signal: AbortSignal): Promise<{
        conn: SshConnection;
        server: SshServer;
    }>;
    /** Mode-aware directory listing for one session (panel behavior). */
    list(sessionId: SessionKey, path: string, signal?: AbortSignal): Promise<SshListing>;
    /** Mode-aware text read with the configured size cap. */
    read(sessionId: SessionKey, path: string, maxBytes: number, signal?: AbortSignal): Promise<string>;
    /** Mode-aware atomic text write. */
    write(sessionId: SessionKey, path: string, content: string, signal?: AbortSignal): Promise<void>;
    /** Mode-aware directory creation. */
    mkdir(sessionId: SessionKey, path: string, signal?: AbortSignal): Promise<void>;
    /** Mode-aware file/directory deletion. */
    unlink(sessionId: SessionKey, path: string, signal?: AbortSignal): Promise<void>;
    /** The live connection of one session (must be connected first). */
    connection(sessionId: SessionKey): SshConnection;
    /** The connected connection of one session, throwing when not connected. */
    requireConnectedFor(sessionId: SessionKey): SshConnection;
    /** Tear down every live connection (host teardown). */
    dispose(): Promise<void>;
}
//# sourceMappingURL=store.d.ts.map