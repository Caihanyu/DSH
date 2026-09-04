/**
 * `dsh-ssh-files` host half: mounts the `/ssh-files` RPC channel that the
 * browser panel drives and registers the model-facing `ssh_*` tools. Both
 * route through one {@link SshSessionStore}, which keeps a shared saved-server
 * pool plus an isolated preference and live SSH connection per session — local
 * work and each remote server session never share state or a channel. The
 * channel is loopback-only (the same trust fence as every `/api` request).
 * @module @deepseek-ai/dsh-ssh-files
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
export type { SshMode, SshServer, SshAuth, SessionPref, SshState } from './state.ts';
export type { SshFileEntry, SshListing } from './ssh.ts';
export type { SshPanelState, SshStateResponse, SshServerInput } from './store.ts';
export { SshSessionStore } from './store.ts';
/** Validated plugin configuration. */
export interface Config {
    /** Size cap for one `read` (bytes); larger files are refused. */
    readMaxBytes: number;
    /** SSH handshake timeout in milliseconds. */
    connectTimeoutMs: number;
    /** Deadline for one SFTP round trip (ms); a silent server is disconnected. */
    opTimeoutMs: number;
    /** Cap on one model `ssh_write` content (characters). */
    writeMaxChars: number;
    /** Cap on one model `ssh_read` window (lines). */
    readMaxLines: number;
    /** Cap on one `ssh_exec` captured stream (characters). */
    execMaxChars: number;
    /** Executable that opens a code file: a PATH name or an absolute path. */
    code: string;
    /** Executable that opens a Markdown file: a PATH name or an absolute path. */
    marktext: string;
}
export declare const Config: z<Config>;
/** Stable Cordis plugin name. */
export declare const name = "ssh-files";
/** Required services: the RPC registry, the tool registry, and system prompt. */
export declare const inject: string[];
/**
 * Mount the `/ssh-files` RPC channel and register the `ssh_*` tools.
 *
 * RPC endpoints (every state/fs endpoint takes the session id in `payload`,
 * so each conversation panel reads and drives only its own session):
 * - `get-state` / `set-mode` / `add-server` / `update-server` / `remove-server`
 *   / `connect` / `disconnect` — per-session state and the shared server pool.
 * - `list` / `read` / `write` / `mkdir` / `unlink` — mode-aware file operations
 *   for the calling session.
 * - `open-local` — open a local path in a desktop app (local mode only).
 *
 * The channel is loopback-only (the same trust fence as every `/api` request).
 * @param ctx - cordis context carrying `connection`, `tools`, and `systemPrompt`.
 * @param config - validated read caps, timeouts, and desktop openers.
 */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map