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
/** The two working modes the panel exposes. */
export type SshMode = 'local' | 'ssh';
/** Authentication strategy for one saved server. */
export type SshAuth = 'password' | 'key' | 'agent';
/**
 * One saved remote server. `root` is the initial directory the file tree
 * opens at; an empty string resolves to the server's home directory.
 * Passwords are stored in the plugin's own state file under the harness home
 * (the same trust level as `~/.ssh/config`), never in a patch or bundle.
 */
export interface SshServer {
    /** Stable record id (generated on add, never user-edited). */
    id: string;
    /** Display name shown in the server selector. */
    name: string;
    /** Host name or IP address. */
    host: string;
    /** SSH port (default 22). */
    port: number;
    /** Login user name. */
    username: string;
    /** How the connection authenticates. */
    auth: SshAuth;
    /** Password for `auth === 'password'`. */
    password?: string;
    /** Absolute path of the private key for `auth === 'key'`. */
    keyPath?: string;
    /** Initial directory; empty means the login home directory. */
    root: string;
}
/** One session's working preference: the mode and the server it uses. */
export interface SessionPref {
    /** The working mode this session opens in. */
    mode: SshMode;
    /** The server this session connects to (may be stale after restarts). */
    serverId: string | null;
}
/** The whole persisted plugin state (v2). */
export interface SshState {
    /** Saved server records, shared by every session, in display order. */
    servers: SshServer[];
    /** Preference brand-new sessions inherit (the most recent choice). */
    defaultPref: SessionPref;
    /** Per-session preferences keyed by session id — the isolation boundary. */
    sessions: Record<string, SessionPref>;
}
/** Absolute path of the state file. */
export declare function stateFilePath(): string;
/** A fresh unique server record id. */
export declare function createServerId(): string;
/** Default field values for a new server record. */
export declare function defaultServer(): Omit<SshServer, 'id'>;
/** A fresh local-mode, no-server preference. */
export declare function freshPref(): SessionPref;
/**
 * The preference a session starts from: its own durable one when present,
 * else the shared most-recent default. Returns a copy — callers mutate and
 * persist through the store, never the durable object in place.
 * @param state - current durable state.
 * @param sessionId - session key; `undefined`/empty means a brand-new session.
 */
export declare function prefFor(state: SshState, sessionId: string | undefined): SessionPref;
/**
 * Parse a decoded state file, migrating the v1 shape (a single global
 * `mode`/`activeServerId`) into the v2 default preference. Malformed rows are
 * dropped rather than failing the whole boot (the file is best-effort user
 * data), and an unreadable file is treated as fresh state.
 * @param raw - the raw JSON text of the state file.
 * @returns the validated state, always structurally sound.
 */
export declare function parseState(raw: string): SshState;
/** Load the persisted state; a missing or unreadable file means fresh state. */
export declare function loadState(): Promise<SshState>;
/** Persist the state file atomically (temp + rename under the same directory). */
export declare function saveState(state: SshState): Promise<void>;
//# sourceMappingURL=state.d.ts.map