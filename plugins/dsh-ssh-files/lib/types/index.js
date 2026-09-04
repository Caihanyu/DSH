/**
 * `dsh-ssh-files` host half: mounts the `/ssh-files` RPC channel that the
 * browser panel drives and registers the model-facing `ssh_*` tools. Both
 * route through one {@link SshSessionStore}, which keeps a shared saved-server
 * pool plus an isolated preference and live SSH connection per session — local
 * work and each remote server session never share state or a channel. The
 * channel is loopback-only (the same trust fence as every `/api` request).
 * @module @deepseek-ai/dsh-ssh-files
 */
import { runNativeCommand } from '@deepseek-ai/dsh-native-command';
import z from '@deepseek-ai/schemastery';
import { SshSessionStore } from "./store.js";
import { registerSshTools } from "./tools.js";
export { SshSessionStore } from "./store.js";
export const Config = z.object({
    readMaxBytes: z.number().default(1024 * 1024),
    connectTimeoutMs: z.number().default(15000),
    opTimeoutMs: z.number().default(120000),
    writeMaxChars: z.number().default(200000),
    readMaxLines: z.number().default(2000),
    execMaxChars: z.number().default(20000),
    code: z.string().default('code'),
    marktext: z.string().default('marktext'),
});
/** Stable Cordis plugin name. */
export const name = 'ssh-files';
/** Required services: the RPC registry, the tool registry, and system prompt. */
export const inject = ['connection', 'tools', 'systemPrompt'];
/** Recover the session key from a payload (`''` when absent = default session). */
function sessionKeyOf(payload) {
    if (typeof payload === 'object' && payload !== null) {
        const value = payload.sessionId;
        return typeof value === 'string' && value.length > 0 ? value : '';
    }
    return '';
}
/** Recovers a validated `{ mode }` payload; undefined = malformed. */
function parseMode(payload) {
    if (typeof payload !== 'object' || payload === null)
        return undefined;
    const mode = payload.mode;
    return mode === 'local' || mode === 'ssh' ? mode : undefined;
}
/** Recovers a valid non-empty string field from a request payload. */
function parseStringField(payload, key) {
    if (typeof payload !== 'object' || payload === null)
        return undefined;
    const value = payload[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}
/** Recovers a valid string field (may be empty) from a request payload. */
function parseOptionalString(payload, key) {
    if (typeof payload !== 'object' || payload === null)
        return undefined;
    const value = payload[key];
    return typeof value === 'string' ? value : undefined;
}
/**
 * Validate an add/update server payload, or throw with the first invalid
 * field named. Passwords arrive over the loopback fence; the record is
 * persisted in the plugin's own state file.
 */
function parseServerInput(payload) {
    if (typeof payload !== 'object' || payload === null)
        throw new Error('服务器信息格式无效');
    const record = payload;
    const name = parseStringField(record, 'name');
    const host = parseStringField(record, 'host');
    const username = parseOptionalString(record, 'username');
    const root = parseOptionalString(record, 'root') ?? '';
    const auth = record.auth;
    if (name === undefined)
        throw new Error('请填写服务器名称');
    if (host === undefined)
        throw new Error('请填写主机地址');
    if (username === undefined || username === '')
        throw new Error('请填写登录用户名');
    if (auth !== 'password' && auth !== 'key' && auth !== 'agent')
        throw new Error('认证方式无效');
    const port = record.port;
    if (typeof port !== 'number' || !Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('端口必须是 1-65535 的整数');
    }
    const input = {
        name, host, port, username, auth, root,
    };
    const password = parseOptionalString(record, 'password');
    if (password !== undefined)
        input.password = password;
    const keyPath = parseOptionalString(record, 'keyPath');
    if (keyPath !== undefined)
        input.keyPath = keyPath;
    return input;
}
/** PowerShell single-quoted literal (doubles embedded quotes). */
function powershellLiteral(value) {
    return `'${value.replace(/'/g, "''")}'`;
}
/** Whether a native-command failure names a missing executable (en/zh text). */
const NOT_FOUND_RE = /not (recognized|found)|CommandNotFound|无法将.+识别为|不是内部或外部命令/;
/**
 * Open one local path in a desktop app. Windows opens through PowerShell
 * because common openers are `.cmd` shims (`code` → `code.cmd`) that
 * `execFile` cannot spawn directly; macOS/Linux run the executable directly.
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
        if (error?.code === 'ENOENT' || NOT_FOUND_RE.test(message)) {
            throw new Error(`找不到可执行程序 "${command}"：请确认已安装并加入 PATH，或在插件配置（cordis.patch.yml 的 ssh-files 行）中填写完整路径`);
        }
        throw error instanceof Error ? error : new Error(message);
    }
}
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
export function apply(ctx, config) {
    const resolved = config;
    const store = new SshSessionStore(resolved.opTimeoutMs);
    ctx.effect(() => () => { void store.dispose(); }, 'ssh-files: session teardown');
    // Model-facing tools share the same per-session store as the panel.
    registerSshTools(ctx, store, {
        connectTimeoutMs: resolved.connectTimeoutMs,
        readMaxBytes: resolved.readMaxBytes,
        writeMaxChars: resolved.writeMaxChars,
        readMaxLines: resolved.readMaxLines,
        execMaxChars: resolved.execMaxChars,
    });
    const handler = async (endpoint, payload, signal) => {
        try {
            const session = sessionKeyOf(payload);
            switch (endpoint) {
                case 'get-state':
                    return { ok: true, value: await store.response(session) };
                case 'set-mode': {
                    const mode = parseMode(payload);
                    if (mode === undefined)
                        throw new Error('工作方式无效：仅支持 local 与 ssh');
                    return { ok: true, value: await store.setMode(session, mode) };
                }
                case 'add-server':
                    return { ok: true, value: await store.addServer(parseServerInput(payload), session) };
                case 'update-server': {
                    const record = (payload ?? {});
                    const id = parseStringField(record, 'id');
                    if (id === undefined)
                        throw new Error('缺少服务器 id');
                    return { ok: true, value: await store.updateServer(id, parseServerInput(record.server), session) };
                }
                case 'remove-server': {
                    const id = parseStringField(payload, 'id');
                    if (id === undefined)
                        throw new Error('缺少服务器 id');
                    return { ok: true, value: await store.removeServer(id, session) };
                }
                case 'connect': {
                    const id = parseStringField(payload, 'id');
                    if (id === undefined)
                        throw new Error('缺少服务器 id');
                    return { ok: true, value: await store.connect(session, id, resolved.connectTimeoutMs, signal) };
                }
                case 'disconnect':
                    return { ok: true, value: await store.disconnect(session) };
                case 'list': {
                    const path = parseStringField(payload, 'path');
                    if (path === undefined)
                        throw new Error('缺少目录路径');
                    return { ok: true, value: await store.list(session, path, signal) };
                }
                case 'read': {
                    const path = parseStringField(payload, 'path');
                    if (path === undefined)
                        throw new Error('缺少文件路径');
                    const content = await store.read(session, path, resolved.readMaxBytes, signal);
                    return { ok: true, value: { content } };
                }
                case 'write': {
                    const record = (payload ?? {});
                    const path = parseStringField(record, 'path');
                    const content = record.content;
                    if (path === undefined)
                        throw new Error('缺少文件路径');
                    if (typeof content !== 'string')
                        throw new Error('缺少文件内容');
                    await store.write(session, path, content, signal);
                    return { ok: true, value: { written: true } };
                }
                case 'mkdir': {
                    const path = parseStringField(payload, 'path');
                    if (path === undefined)
                        throw new Error('缺少目录路径');
                    await store.mkdir(session, path, signal);
                    return { ok: true, value: { created: true } };
                }
                case 'unlink': {
                    const path = parseStringField(payload, 'path');
                    if (path === undefined)
                        throw new Error('缺少路径');
                    await store.unlink(session, path, signal);
                    return { ok: true, value: { removed: true } };
                }
                case 'open-local': {
                    const record = (payload ?? {});
                    const path = parseStringField(record, 'path');
                    const command = record.command;
                    if (path === undefined)
                        throw new Error('缺少文件路径');
                    if (command !== 'code' && command !== 'marktext')
                        throw new Error('缺少打开方式');
                    await runOpener(command === 'code' ? resolved.code : resolved.marktext, path, signal);
                    return { ok: true, value: { opened: true } };
                }
                default:
                    throw new Error(`未知端点 ${endpoint}`);
            }
        }
        catch (error) {
            if (signal.aborted) {
                return { ok: false, error: { code: 'cancelled', message: '操作已取消', details: {} } };
            }
            const message = error instanceof Error ? error.message : String(error);
            return { ok: false, error: { code: 'internal', message, details: {} } };
        }
    };
    ctx.effect(() => ctx.connection.rpc.handle('/ssh-files', handler, { authority: 'loopback' }), 'ssh-files: rpc channel');
}
//# sourceMappingURL=index.js.map