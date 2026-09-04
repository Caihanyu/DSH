/**
 * The SSH connection manager: one live ssh2 client with its SFTP channel at a
 * time, plus the remote file operations (list/read/write/mkdir/unlink) the
 * panel's file tree and editor use. Authentication follows the saved server
 * record: password, private key file, or the platform SSH agent.
 * @module @deepseek-ai/dsh-ssh-files/ssh
 */
import type { SshServer } from './state.ts';
/** One file or directory row of a remote listing (wire type, browser-safe). */
export interface SshFileEntry {
    /** Base name shown in the tree row. */
    name: string;
    /** Absolute remote path — the client never joins path segments itself. */
    path: string;
    /** Directory or file. */
    kind: 'dir' | 'file';
    /** Hidden by the server platform's convention (dot-prefixed). */
    hidden: boolean;
}
/** One listed remote directory level. */
export interface SshListing {
    /** Absolute path of the listed directory. */
    path: string;
    /** Direct children, directories first, each group name-sorted. */
    entries: SshFileEntry[];
}
/** Result of a successful connect: the login home and the effective tree root. */
export interface SshConnectResult {
    /** The SFTP session's login directory (home). */
    home: string;
    /** The directory the file tree opens at: the configured `root`, else home. */
    root: string;
}
/**
 * The live SSH connection. Owns exactly one ssh2 client + SFTP channel;
 * `connect` replaces any previous connection and `disconnect` tears it down.
 * All file operations throw when no connection is active.
 */
export declare class SshConnection {
    private readonly opTimeoutMs;
    private client;
    private sftp;
    private server;
    private home;
    /**
     * @param opTimeoutMs - deadline for one SFTP round trip. A server that does
     *   not answer within it is disconnected: ssh2 cannot cancel an in-flight
     *   SFTP request, so ending the connection is how the wait ends.
     */
    constructor(opTimeoutMs?: number);
    /** Whether an SFTP channel is currently usable. */
    get connected(): boolean;
    /** The server record of the active connection, or null. */
    get activeServer(): SshServer | null;
    /** The resolved login home of the active connection, or null. */
    get activeHome(): string | null;
    /** The active SFTP channel, throwing a clear error when not connected. */
    private requireSftp;
    /**
     * Connect to a server: open the ssh2 client, then its SFTP channel, then
     * resolve the login home. Any prior connection is dropped first.
     * @param server - the server record to connect to.
     * @param timeoutMs - handshake timeout (ssh2 `readyTimeout`).
     * @param signal - abort cancels the attempt.
     * @returns the login home and the effective tree root.
     */
    connect(server: SshServer, timeoutMs: number, signal: AbortSignal): Promise<SshConnectResult>;
    /** Open the ssh2 client and its SFTP channel as one promise. */
    private openSftp;
    /**
     * Build the ssh2 connect config from a server record. `password` and `key`
     * set their ssh2 fields; `agent` (and any record with neither) leaves ssh2
     * to its default authentication order (agent then `~/.ssh` keys).
     */
    private buildConfig;
    /** Tear down the active connection (no-op when none is active). */
    disconnect(): Promise<void>;
    /**
     * Run one SFTP request under the op deadline and the caller's abort signal,
     * mapping genuine SFTP failures to friendly text. ssh2 cannot cancel one
     * in-flight request: when the deadline passes or the signal aborts, the
     * whole connection is ended so this request (and any sibling on it) settles
     * instead of hanging — the caller-visible stop path requires the tool body
     * to reach quiescence before the turn can abort.
     * @param what - operation name for the stall message.
     * @param signal - caller cancellation; abort rejects with a stall error.
     * @param start - starts the SFTP request and returns its promise.
     */
    private boundedSftp;
    /** Classify one readdir row: resolve symlinks so the tree shows the target kind. */
    private classifyEntry;
    /**
     * List one remote directory level: directories first, each group
     * name-sorted, symlinks classified by their resolved target.
     * @param path - absolute remote directory to list.
     * @returns the level's rows.
     */
    list(path: string, signal?: AbortSignal): Promise<SshListing>;
    /**
     * Read a remote file as UTF-8 text. Binary content and files above
     * `maxBytes` are rejected so the browser editor never holds junk.
     * @param path - absolute remote path.
     * @param maxBytes - size cap; larger files are refused with a clear message.
     * @returns the decoded text.
     */
    read(path: string, maxBytes: number, signal?: AbortSignal): Promise<string>;
    /**
     * Write a remote file atomically: temp file on the server, then POSIX
     * rename over the target. A failed upload leaves the target untouched.
     * @param path - absolute remote path (created when missing).
     * @param content - the UTF-8 text to write.
     */
    write(path: string, content: string, signal?: AbortSignal): Promise<void>;
    /** Create one remote directory (parent must exist). */
    mkdir(path: string, signal?: AbortSignal): Promise<void>;
    /** Delete one remote file or (empty) directory. */
    unlink(path: string, signal?: AbortSignal): Promise<void>;
    /**
     * Run one remote command over the ssh2 shell channel and capture its
     * output. The command runs in the login shell; an optional `cwd` first
     * `cd`s into a directory (single-quoted against shell metacharacters).
     * @param command - the command line to run.
     * @param options - an optional working directory and per-stream cap.
     * @returns exit code plus captured stdout/stderr, each capped.
     */
    exec(command: string, options?: {
        cwd?: string;
        maxChars?: number;
    }, signal?: AbortSignal): Promise<{
        code: number | null;
        stdout: string;
        stderr: string;
    }>;
}
//# sourceMappingURL=ssh.d.ts.map