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
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { runNativeCommand } from '@deepseek-ai/dsh-native-command';
import z from '@deepseek-ai/schemastery';
export const Config = z.object({
    code: z.string().default('code'),
    marktext: z.string().default('marktext'),
});
/** Stable Cordis plugin name. */
export const name = 'workspace-files';
/** Required services: the connection transport's RPC registry. */
export const inject = ['connection'];
/** Recover one validated `{ path }` request payload; undefined = malformed. */
function parsePath(payload) {
    if (typeof payload !== 'object' || payload === null)
        return undefined;
    const path = payload.path;
    return typeof path === 'string' && path.length > 0 ? path : undefined;
}
/** Recover a valid non-empty string field from a request payload. */
function parseStringField(payload, key) {
    if (typeof payload !== 'object' || payload === null)
        return undefined;
    const value = payload[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}
/**
 * List one directory level: real files and directories only (symlinks,
 * sockets, and devices are skipped — a browser cannot open them in an
 * editor), directories first, each group name-sorted.
 * @param path - absolute directory to list.
 * @returns the level's file/directory rows.
 */
async function listDirectory(path) {
    const dirents = await readdir(path, { withFileTypes: true });
    const rows = [];
    for (const dirent of dirents) {
        if (!dirent.isDirectory() && !dirent.isFile())
            continue;
        rows.push({
            name: dirent.name,
            path: join(path, dirent.name),
            kind: dirent.isDirectory() ? 'dir' : 'file',
            hidden: dirent.name.startsWith('.'),
        });
    }
    rows.sort((a, b) => a.kind === b.kind
        ? a.name.localeCompare(b.name)
        : a.kind === 'dir' ? -1 : 1);
    return { path, entries: rows };
}
/** PowerShell single-quoted literal (doubles embedded quotes). */
function powershellLiteral(value) {
    return `'${value.replace(/'/g, "''")}'`;
}
/** Whether a native-command failure names a missing executable (en/zh PowerShell text). */
const NOT_FOUND_RE = /not (recognized|found)|CommandNotFound|无法将.+识别为|不是内部或外部命令/;
/**
 * Run one configured opener executable against a path, surfacing actionable
 * failures. Windows opens through PowerShell because common openers are
 * `.cmd` shims (`code` → `code.cmd`) that `execFile` cannot spawn directly;
 * PowerShell resolves both PATH names and absolute paths and invokes `.cmd`
 * via cmd.exe internally. macOS/Linux run the executable directly.
 */
async function runOpener(command, path, signal) {
    try {
        if (process.platform === 'win32') {
            await runNativeCommand('powershell.exe', ['-NoProfile', '-Command', `& ${powershellLiteral(command)} ${powershellLiteral(path)}`], signal);
        }
        else {
            await runNativeCommand(command, [path], signal);
        }
    }
    catch (error) {
        if (signal.aborted)
            throw error;
        const message = error instanceof Error ? error.message : String(error);
        // ENOENT (macOS/Linux) or a PowerShell "not recognized" report = the
        // executable is not on PATH; name the fix instead of the raw error.
        if (error?.code === 'ENOENT' || NOT_FOUND_RE.test(message)) {
            throw new Error(`找不到可执行程序 "${command}"：请确认已安装并加入 PATH，或在插件配置（cordis.patch.yml 的 workspace-files 行）中填写完整路径`);
        }
        throw error instanceof Error ? error : new Error(message);
    }
}
/**
 * Mount the `/workspace-files` RPC channel. Endpoints:
 * - `list` — one directory level with file/directory kinds (`{ path }` → {@link WorkspaceFilesListing})
 * - `open-in-code` — open a path in VS Code (`{ path }`)
 * - `open-in-marktext` — open a path in MarkText (`{ path }`)
 * The channel is loopback-only (the same trust fence as every `/api` request).
 * @param ctx - cordis context carrying the injected `connection` service.
 * @param config - validated opener executables.
 */
export function apply(ctx, config) {
    const handler = async (endpoint, payload, signal) => {
        if (endpoint === 'list') {
            const path = parseStringField(payload, 'path');
            if (path === undefined) {
                return { ok: false, error: { code: 'internal', message: 'workspace-files: list requires a non-empty string path', details: {} } };
            }
            try {
                return { ok: true, value: await listDirectory(path) };
            }
            catch (error) {
                if (signal.aborted) {
                    return { ok: false, error: { code: 'cancelled', message: 'directory listing was aborted', details: {} } };
                }
                const message = error instanceof Error ? error.message : String(error);
                return { ok: false, error: { code: 'internal', message: `workspace-files: 无法读取目录 ${path}: ${message}`, details: {} } };
            }
        }
        const path = parsePath(payload);
        if (path === undefined) {
            return { ok: false, error: { code: 'internal', message: 'workspace-files: request payload must carry a non-empty string path', details: {} } };
        }
        const command = endpoint === 'open-in-code' ? config.code : endpoint === 'open-in-marktext' ? config.marktext : undefined;
        if (command === undefined) {
            return { ok: false, error: { code: 'internal', message: `workspace-files: unknown endpoint ${endpoint}`, details: {} } };
        }
        try {
            await runOpener(command, path, signal);
            return { ok: true, value: { opened: true } };
        }
        catch (error) {
            if (signal.aborted) {
                return { ok: false, error: { code: 'cancelled', message: 'path open was aborted', details: {} } };
            }
            const message = error instanceof Error ? error.message : String(error);
            return { ok: false, error: { code: 'internal', message, details: {} } };
        }
    };
    ctx.effect(() => ctx.connection.rpc.handle('/workspace-files', handler, { authority: 'loopback' }), 'workspace-files: rpc channel');
}
//# sourceMappingURL=index.js.map