/**
 * Model-facing `ssh_*` tools for `dsh-ssh-files`. Each call routes through
 * the session of the agent that issued it (`exec.agent.id` — the same session
 * key the `/ssh-files` panel uses), so a conversation's SSH operations are
 * isolated per session: server A in one conversation never shares a channel
 * or preference with server B in another, and local work is untouched.
 * Without an agent (direct SDK/headless dispatch) the tools fall back to the
 * `''` default session, matching the RPC channel's default.
 * @module @deepseek-ai/dsh-ssh-files/tools
 */
import type { Context } from '@deepseek-ai/cordis';
import { SshSessionStore } from './store.ts';
/** Tool caps derived from the plugin config plus fixed limits. */
export interface SshToolCaps {
    /** SSH handshake timeout (ms). */
    connectTimeoutMs: number;
    /** Cap on one text read (bytes), matching the panel's read cap. */
    readMaxBytes: number;
    /** Cap on one written file's characters (model output granularity). */
    writeMaxChars: number;
    /** Cap on one read window's total lines. */
    readMaxLines: number;
    /** Cap on one command's captured stream length. */
    execMaxChars: number;
}
/** Register the full `ssh_*` tool suite on `ctx.tools`. */
export declare function registerSshTools(ctx: Context, store: SshSessionStore, caps: SshToolCaps): void;
//# sourceMappingURL=tools.d.ts.map