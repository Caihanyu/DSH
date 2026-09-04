/**
 * `dsh-workspace-files` host half: registers the `/workspace-files` RPC
 * channel that lists one directory level with file/directory kinds and opens
 * a filesystem path in a specific desktop application — VS Code for code,
 * MarkText for Markdown — on the connection transport. The shipped host
 * offers neither (its `host.listDirectory` lists directories only, and its
 * openers hand paths to the default application), so this channel is the
 * plugin's own surface; the client's default-app open still rides the
 * existing `host.openPath`.
 * @module @deepseek-ai/dsh-workspace-files
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
/** One row of a workspace-files directory listing (wire type, browser-safe). */
export interface WorkspaceFilesEntry {
    /** Base name shown in the tree row. */
    name: string;
    /** Absolute host path — the client never joins path segments itself. */
    path: string;
    /** Directory or file. */
    kind: 'dir' | 'file';
    /** Hidden by the host platform's convention (dot-prefixed on POSIX); the client owns whether to show it. */
    hidden: boolean;
}
/** `list` response value: one directory level. */
export interface WorkspaceFilesListing {
    /** Absolute path of the listed directory. */
    path: string;
    /** Direct children, directories first, each group name-sorted. */
    entries: WorkspaceFilesEntry[];
}
/** Validated plugin configuration. */
export interface Config {
    /** Executable that opens a code file: a PATH name or an absolute path (default `code`). */
    code: string;
    /** Executable that opens a Markdown file: a PATH name or an absolute path (default `marktext`). */
    marktext: string;
}
export declare const Config: z<Config>;
/** Stable Cordis plugin name. */
export declare const name = "workspace-files";
/** Required services: the connection transport's RPC registry. */
export declare const inject: string[];
/**
 * Mount the `/workspace-files` RPC channel. Endpoints:
 * - `list` — one directory level with file/directory kinds (`{ path }` → {@link WorkspaceFilesListing})
 * - `open-in-code` — open a path in VS Code (`{ path }`)
 * - `open-in-marktext` — open a path in MarkText (`{ path }`)
 * The channel is loopback-only (the same trust fence as every `/api` request).
 * @param ctx - cordis context carrying the injected `connection` service.
 * @param config - validated opener executables.
 */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map