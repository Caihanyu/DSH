// src/index.ts
import { runNativeCommand } from "@deepseek-ai/dsh-native-command";
import z from "@deepseek-ai/schemastery";

// src/store.ts
import { mkdir as mkdir2, readdir, readFile as readFile3, rename as rename2, stat, unlink as unlink2, writeFile as writeFile2 } from "node:fs/promises";
import { join } from "node:path";

// src/ssh.ts
import { readFile } from "node:fs/promises";
import { Client } from "ssh2";
function sftpCall(fn, ...args) {
  return new Promise((resolve, reject) => {
    fn(...args, (error, value) => {
      if (error) reject(error);
      else resolve(value);
    });
  });
}
function joinRemote(dir, name2) {
  return dir.endsWith("/") ? dir + name2 : `${dir}/${name2}`;
}
function posixQuote(value) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
function capOutput(text2, maxChars) {
  return text2.length > maxChars ? `${text2.slice(0, maxChars)}
\u2026 (\u8F93\u51FA\u5DF2\u622A\u65AD)` : text2;
}
function mapSshError(error, server) {
  const message = error instanceof Error ? error.message : String(error);
  const host = `${server.username}@${server.host}:${server.port}`;
  if (/timed out while waiting for handshake|ETIMEDOUT|timeout/i.test(message)) {
    return new Error(`\u8FDE\u63A5 ${host} \u8D85\u65F6\uFF08${message}\uFF09`);
  }
  if (/all configured authentication methods failed|authentication failed/i.test(message)) {
    return new Error(`\u8BA4\u8BC1\u5931\u8D25\uFF1A\u8BF7\u68C0\u67E5 ${host} \u7684\u7528\u6237\u540D\u3001\u5BC6\u7801\u6216\u79C1\u94A5`);
  }
  if (/ECONNREFUSED|Connection refused/i.test(message)) {
    return new Error(`\u8FDE\u63A5\u88AB\u62D2\u7EDD\uFF1A${host} \u7684\u7AEF\u53E3\u53EF\u80FD\u672A\u5F00\u653E\u6216\u670D\u52A1\u672A\u542F\u52A8`);
  }
  if (/ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(message)) {
    return new Error(`\u65E0\u6CD5\u89E3\u6790\u4E3B\u673A\u540D\uFF1A${server.host}`);
  }
  if (/encrypted private key|passphrase/i.test(message)) {
    return new Error(`\u79C1\u94A5\u5DF2\u52A0\u5BC6\uFF1A\u8BF7\u4F7F\u7528 ssh-agent \u8BA4\u8BC1\u6216\u5728\u670D\u52A1\u5668\u8BB0\u5F55\u4E2D\u6539\u7528\u5BC6\u7801\u8BA4\u8BC1`);
  }
  if (/no supported authentication methods/i.test(message)) {
    return new Error(`\u670D\u52A1\u5668\u4E0D\u652F\u6301\u8BE5\u8BA4\u8BC1\u65B9\u5F0F\uFF1A\u8BF7\u4E3A ${host} \u66F4\u6362\u8BA4\u8BC1\u65B9\u5F0F`);
  }
  return new Error(`\u8FDE\u63A5 ${host} \u5931\u8D25\uFF1A${message}`);
}
var SFTP_ERROR_MESSAGES = {
  NO_SUCH_FILE: "\u6587\u4EF6\u6216\u76EE\u5F55\u4E0D\u5B58\u5728",
  PERMISSION_DENIED: "\u6743\u9650\u4E0D\u8DB3",
  FAILURE: "\u64CD\u4F5C\u5931\u8D25\uFF08\u670D\u52A1\u5668\u62D2\u7EDD\uFF09",
  NOT_A_DIRECTORY: "\u4E0D\u662F\u76EE\u5F55",
  IS_A_DIRECTORY: "\u662F\u76EE\u5F55\u800C\u975E\u6587\u4EF6",
  NO_SUCH_PATH: "\u8DEF\u5F84\u4E0D\u5B58\u5728",
  ALREADY_EXISTS: "\u5DF2\u5B58\u5728\u540C\u540D\u6587\u4EF6\u6216\u76EE\u5F55"
};
function mapSftpError(error) {
  const err = error;
  const code = err?.code;
  const key = typeof code === "string" ? code : String(code);
  const friendly = SFTP_ERROR_MESSAGES[key] ?? SFTP_ERROR_MESSAGES[code?.toString() ?? ""];
  const raw = err?.message !== void 0 && err.message !== "" ? err.message : String(error);
  return new Error(friendly !== void 0 ? `${friendly}\uFF08${raw}\uFF09` : `\u8FDC\u7A0B\u64CD\u4F5C\u5931\u8D25\uFF1A${raw}`);
}
var SftpStallError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "SftpStallError";
  }
};
var SshConnection = class {
  /**
   * @param opTimeoutMs - deadline for one SFTP round trip. A server that does
   *   not answer within it is disconnected: ssh2 cannot cancel an in-flight
   *   SFTP request, so ending the connection is how the wait ends.
   */
  constructor(opTimeoutMs = 12e4) {
    this.opTimeoutMs = opTimeoutMs;
  }
  opTimeoutMs;
  client = null;
  sftp = null;
  server = null;
  home = null;
  /** Whether an SFTP channel is currently usable. */
  get connected() {
    return this.client !== null && this.sftp !== null;
  }
  /** The server record of the active connection, or null. */
  get activeServer() {
    return this.server;
  }
  /** The resolved login home of the active connection, or null. */
  get activeHome() {
    return this.home;
  }
  /** The active SFTP channel, throwing a clear error when not connected. */
  requireSftp() {
    if (this.sftp === null) throw new Error("\u5C1A\u672A\u8FDE\u63A5\u670D\u52A1\u5668\uFF0C\u8BF7\u5148\u5728\u9762\u677F\u4E2D\u9009\u62E9\u5E76\u8FDE\u63A5");
    return this.sftp;
  }
  /**
   * Connect to a server: open the ssh2 client, then its SFTP channel, then
   * resolve the login home. Any prior connection is dropped first.
   * @param server - the server record to connect to.
   * @param timeoutMs - handshake timeout (ssh2 `readyTimeout`).
   * @param signal - abort cancels the attempt.
   * @returns the login home and the effective tree root.
   */
  async connect(server, timeoutMs, signal) {
    await this.disconnect();
    const client = new Client();
    this.client = client;
    this.server = server;
    try {
      const sftp = await this.openSftp(client, server, timeoutMs, signal);
      this.sftp = sftp;
      let home;
      try {
        home = await this.boundedSftp("\u89E3\u6790\u4E3B\u76EE\u5F55", signal, () => sftpCall(sftp.realpath.bind(sftp), "."));
      } catch (error) {
        if (error instanceof SftpStallError) throw error;
        home = server.root.trim() !== "" ? server.root : "/";
      }
      this.home = home;
      const root = server.root.trim() !== "" ? server.root : home;
      return { home, root };
    } catch (error) {
      this.client = null;
      this.sftp = null;
      this.server = null;
      this.home = null;
      try {
        client.end();
      } catch {
      }
      throw error;
    }
  }
  /** Open the ssh2 client and its SFTP channel as one promise. */
  async openSftp(client, server, timeoutMs, signal) {
    let config;
    try {
      config = await this.buildConfig(server, timeoutMs);
    } catch (error) {
      throw mapSshError(error, server);
    }
    return new Promise((resolve, reject) => {
      let settled = false;
      const fail = (error) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener("abort", onAbort);
        reject(error);
      };
      const onAbort = () => {
        fail(new Error("\u8FDE\u63A5\u5DF2\u53D6\u6D88"));
        try {
          client.end();
        } catch {
        }
      };
      const onError = (error) => {
        fail(mapSshError(error, server));
      };
      client.once("error", onError);
      client.once("ready", () => {
        client.sftp((error, sftp) => {
          if (error) {
            fail(mapSshError(error, server));
            return;
          }
          if (sftp === void 0) {
            fail(new Error("\u670D\u52A1\u5668\u672A\u63D0\u4F9B SFTP \u901A\u9053"));
            return;
          }
          settled = true;
          signal.removeEventListener("abort", onAbort);
          resolve(sftp);
        });
      });
      client.once("close", () => {
        if (!settled) fail(new Error("\u8FDE\u63A5\u5728\u5C31\u7EEA\u524D\u88AB\u670D\u52A1\u5668\u5173\u95ED"));
      });
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
      try {
        client.connect(config);
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
  /**
   * Build the ssh2 connect config from a server record. `password` and `key`
   * set their ssh2 fields; `agent` (and any record with neither) leaves ssh2
   * to its default authentication order (agent then `~/.ssh` keys).
   */
  async buildConfig(server, timeoutMs) {
    const config = {
      host: server.host,
      port: server.port,
      username: server.username,
      readyTimeout: timeoutMs,
      keepaliveInterval: 3e4,
      keepaliveCountMax: 3
    };
    if (server.auth === "password" && server.password !== void 0 && server.password !== "") {
      config.password = server.password;
    } else if (server.auth === "key" && server.keyPath !== void 0 && server.keyPath !== "") {
      try {
        config.privateKey = await readFile(server.keyPath, "utf8");
      } catch (error) {
        throw new Error(`\u65E0\u6CD5\u8BFB\u53D6\u79C1\u94A5\u6587\u4EF6 ${server.keyPath}\uFF1A${error.code ?? error}`);
      }
    }
    return config;
  }
  /** Tear down the active connection (no-op when none is active). */
  async disconnect() {
    const client = this.client;
    this.client = null;
    this.home = null;
    this.sftp = null;
    this.server = null;
    if (client === null) return;
    try {
      client.end();
    } catch {
    }
  }
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
  async boundedSftp(what, signal, start) {
    if (signal?.aborted === true) {
      throw new SftpStallError(`\u64CD\u4F5C\u5DF2\u53D6\u6D88\uFF08${what}\uFF09`);
    }
    return new Promise((resolve, reject) => {
      let settled = false;
      let timer;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        if (timer !== void 0) clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        if (error !== null) reject(error);
        else resolve(value);
      };
      const onAbort = () => {
        if (settled) return;
        void this.disconnect();
        finish(new SftpStallError(`\u64CD\u4F5C\u5DF2\u53D6\u6D88\uFF08${what}\uFF09`), void 0);
      };
      timer = setTimeout(() => {
        if (settled) return;
        void this.disconnect();
        finish(new SftpStallError(
          `${what}\u8D85\u65F6\uFF1A\u670D\u52A1\u5668\u8D85\u8FC7 ${this.opTimeoutMs} ms \u672A\u54CD\u5E94\uFF0C\u8FDE\u63A5\u5DF2\u65AD\u5F00`
        ), void 0);
      }, this.opTimeoutMs);
      signal?.addEventListener("abort", onAbort, { once: true });
      if (signal?.aborted === true) {
        onAbort();
        return;
      }
      try {
        start().then(
          (value) => finish(null, value),
          (error) => finish(mapSftpError(error), void 0)
        );
      } catch (error) {
        finish(mapSftpError(error), void 0);
      }
    });
  }
  /** Classify one readdir row: resolve symlinks so the tree shows the target kind. */
  async classifyEntry(entry, dirPath, signal) {
    if (entry.attrs.isDirectory()) return "dir";
    if (entry.attrs.isFile()) return "file";
    if (entry.attrs.isSymbolicLink()) {
      const sftp = this.requireSftp();
      try {
        const target = await this.boundedSftp("\u89E3\u6790\u94FE\u63A5\u76EE\u6807", signal, () => sftpCall(sftp.stat.bind(sftp), joinRemote(dirPath, entry.filename)));
        return target.isDirectory() ? "dir" : "file";
      } catch (error) {
        if (error instanceof SftpStallError) throw error;
        return "file";
      }
    }
    return "file";
  }
  /**
   * List one remote directory level: directories first, each group
   * name-sorted, symlinks classified by their resolved target.
   * @param path - absolute remote directory to list.
   * @returns the level's rows.
   */
  async list(path, signal) {
    const sftp = this.requireSftp();
    const rows = await this.boundedSftp("\u5217\u51FA\u76EE\u5F55", signal, () => sftpCall(sftp.readdir.bind(sftp), path));
    const entries = [];
    for (const row of rows) {
      const kind = await this.classifyEntry(row, path, signal);
      entries.push({
        name: row.filename,
        path: joinRemote(path, row.filename),
        kind,
        hidden: row.filename.startsWith(".")
      });
    }
    entries.sort((a, b) => a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "dir" ? -1 : 1);
    return { path, entries };
  }
  /**
   * Read a remote file as UTF-8 text. Binary content and files above
   * `maxBytes` are rejected so the browser editor never holds junk.
   * @param path - absolute remote path.
   * @param maxBytes - size cap; larger files are refused with a clear message.
   * @returns the decoded text.
   */
  async read(path, maxBytes, signal) {
    const sftp = this.requireSftp();
    const stats = await this.boundedSftp("\u8BFB\u53D6", signal, () => sftpCall(sftp.stat.bind(sftp), path));
    if (stats.isDirectory()) throw new Error("\u8FD9\u662F\u4E00\u4E2A\u76EE\u5F55\uFF0C\u8BF7\u5C55\u5F00\u540E\u9009\u62E9\u6587\u4EF6");
    if (stats.size > maxBytes) {
      throw new Error(`\u6587\u4EF6\u8FC7\u5927\uFF08${stats.size} \u5B57\u8282\uFF0C\u8D85\u8FC7 ${maxBytes} \u5B57\u8282\u4E0A\u9650\uFF09\uFF0C\u65E0\u6CD5\u5728\u9762\u677F\u4E2D\u7F16\u8F91`);
    }
    const buffer = await this.boundedSftp("\u8BFB\u53D6", signal, () => sftpCall(sftp.readFile.bind(sftp), path));
    const text2 = buffer.toString("utf8");
    if (text2.includes("\0")) throw new Error("\u68C0\u6D4B\u5230\u4E8C\u8FDB\u5236\u5185\u5BB9\uFF0C\u65E0\u6CD5\u4EE5\u6587\u672C\u65B9\u5F0F\u7F16\u8F91");
    return text2;
  }
  /**
   * Write a remote file atomically: temp file on the server, then POSIX
   * rename over the target. A failed upload leaves the target untouched.
   * @param path - absolute remote path (created when missing).
   * @param content - the UTF-8 text to write.
   */
  async write(path, content, signal) {
    const sftp = this.requireSftp();
    const tmp = `${path}.dsh-edit-${process.pid}-${Date.now()}`;
    const buffer = Buffer.from(content, "utf8");
    try {
      await this.boundedSftp("\u5199\u5165", signal, () => sftpCall(sftp.writeFile.bind(sftp), tmp, buffer));
      await this.boundedSftp("\u91CD\u547D\u540D", signal, () => sftpCall(sftp.rename.bind(sftp), tmp, path));
    } catch (error) {
      if (!(error instanceof SftpStallError)) {
        try {
          await this.boundedSftp("\u6E05\u7406\u4E34\u65F6\u6587\u4EF6", void 0, () => sftpCall(sftp.unlink.bind(sftp), tmp));
        } catch {
        }
      }
      throw error;
    }
  }
  /** Create one remote directory (parent must exist). */
  async mkdir(path, signal) {
    const sftp = this.requireSftp();
    await this.boundedSftp("\u521B\u5EFA\u76EE\u5F55", signal, () => sftpCall(sftp.mkdir.bind(sftp), path));
  }
  /** Delete one remote file or (empty) directory. */
  async unlink(path, signal) {
    const sftp = this.requireSftp();
    const stats = await this.boundedSftp("\u8BFB\u53D6", signal, () => sftpCall(sftp.stat.bind(sftp), path));
    if (stats.isDirectory()) {
      await this.boundedSftp("\u5220\u9664\u76EE\u5F55", signal, () => sftpCall(sftp.rmdir.bind(sftp), path));
    } else {
      await this.boundedSftp("\u5220\u9664", signal, () => sftpCall(sftp.unlink.bind(sftp), path));
    }
  }
  /**
   * Run one remote command over the ssh2 shell channel and capture its
   * output. The command runs in the login shell; an optional `cwd` first
   * `cd`s into a directory (single-quoted against shell metacharacters).
   * @param command - the command line to run.
   * @param options - an optional working directory and per-stream cap.
   * @returns exit code plus captured stdout/stderr, each capped.
   */
  async exec(command, options = {}, signal) {
    const client = this.client;
    if (client === null || this.sftp === null) {
      throw new Error("\u5C1A\u672A\u8FDE\u63A5\u670D\u52A1\u5668\uFF0C\u8BF7\u5148\u8FDE\u63A5\uFF08ssh_connect \u6216\u53F3\u4FA7\u9762\u677F\uFF09");
    }
    const maxChars = options.maxChars ?? 2e4;
    const full = options.cwd !== void 0 && options.cwd !== "" ? `cd ${posixQuote(options.cwd)} && ${command}` : command;
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (outcome) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener("abort", onAbort);
        resolve(outcome);
      };
      const fail = (error) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener("abort", onAbort);
        reject(error);
      };
      const onAbort = () => {
        fail(new Error("\u547D\u4EE4\u6267\u884C\u5DF2\u53D6\u6D88"));
        try {
          stream?.close();
        } catch {
        }
      };
      let stream;
      client.exec(full, (error, channel) => {
        if (error) {
          fail(error instanceof Error ? error : new Error(String(error)));
          return;
        }
        stream = channel;
        let stdout = "";
        let stderr = "";
        let code = null;
        channel.on("data", (chunk) => {
          stdout = capOutput(stdout + chunk.toString("utf8"), maxChars);
        });
        if (channel.stderr !== void 0) {
          channel.stderr.on("data", (chunk) => {
            stderr = capOutput(stderr + chunk.toString("utf8"), maxChars);
          });
        }
        channel.on("close", (closeCode) => {
          code = closeCode;
          finish({ code, stdout, stderr });
        });
        channel.on("error", (channelError) => {
          fail(channelError);
        });
      });
      if (signal?.aborted === true) onAbort();
      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }
};

// src/state.ts
import { randomUUID } from "node:crypto";
import { mkdir, readFile as readFile2, rename, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
var STATE_DIR = "ssh-files";
var STATE_FILE = "state.json";
function stateFilePath() {
  return dshHomePath(STATE_DIR, STATE_FILE);
}
function createServerId() {
  return randomUUID();
}
function freshPref() {
  return { mode: "local", serverId: null };
}
function prefFor(state, sessionId) {
  const own = sessionId === void 0 || sessionId === "" ? void 0 : state.sessions[sessionId];
  return { ...own ?? state.defaultPref };
}
function parseServer(value) {
  if (typeof value !== "object" || value === null) return void 0;
  const record = value;
  const id = record.id;
  const name2 = record.name;
  const host = record.host;
  const port = record.port;
  const username = record.username;
  const auth = record.auth;
  const root = record.root;
  if (typeof id !== "string" || id.length === 0) return void 0;
  if (typeof name2 !== "string" || typeof host !== "string" || host.length === 0) return void 0;
  if (typeof port !== "number" || !Number.isInteger(port) || port < 1 || port > 65535) return void 0;
  if (typeof username !== "string") return void 0;
  if (auth !== "password" && auth !== "key" && auth !== "agent") return void 0;
  const server = {
    id,
    name: name2,
    host,
    port,
    username,
    auth,
    root: typeof root === "string" ? root : ""
  };
  if (typeof record.password === "string") server.password = record.password;
  if (typeof record.keyPath === "string") server.keyPath = record.keyPath;
  return server;
}
function parsePref(value) {
  if (typeof value !== "object" || value === null) return freshPref();
  const record = value;
  const mode = record.mode === "ssh" ? "ssh" : "local";
  const serverId = typeof record.serverId === "string" && record.serverId.length > 0 ? record.serverId : typeof record.activeServerId === "string" && record.activeServerId.length > 0 ? record.activeServerId : null;
  return { mode, serverId };
}
function parseState(raw) {
  let decoded;
  const fresh = () => ({ servers: [], defaultPref: freshPref(), sessions: {} });
  try {
    decoded = JSON.parse(raw);
  } catch {
    return fresh();
  }
  if (typeof decoded !== "object" || decoded === null) return fresh();
  const state = decoded;
  const servers = Array.isArray(state.servers) ? state.servers.map(parseServer).filter((server) => server !== void 0) : [];
  if (state.defaultPref !== void 0 || state.sessions !== void 0) {
    return {
      servers,
      defaultPref: parsePref(state.defaultPref),
      sessions: (() => {
        if (typeof state.sessions !== "object" || state.sessions === null) return {};
        const out = {};
        for (const [key, value] of Object.entries(state.sessions)) {
          if (key.length > 0 && key !== "__proto__") out[key] = parsePref(value);
        }
        return out;
      })()
    };
  }
  return {
    servers,
    defaultPref: parsePref(state),
    sessions: {}
  };
}
async function loadState() {
  try {
    const raw = await readFile2(stateFilePath(), "utf8");
    return parseState(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return { servers: [], defaultPref: freshPref(), sessions: {} };
    }
    throw error;
  }
}
async function saveState(state) {
  const file = stateFilePath();
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  await writeFile(tmp, JSON.stringify(state, void 0, 2) + "\n", "utf8");
  await renameFile(tmp, file);
}
async function renameFile(from, to) {
  try {
    await rename(from, to);
  } catch (error) {
    if (error.code !== "EEXIST" && error.code !== "EPERM") throw error;
    await unlink(to);
    await rename(from, to);
  }
}

// src/store.ts
async function listLocal(path) {
  const dirents = await readdir(path, { withFileTypes: true });
  const entries = [];
  for (const dirent of dirents) {
    let kind;
    if (dirent.isDirectory()) {
      kind = "dir";
    } else if (dirent.isFile() || dirent.isSymbolicLink()) {
      kind = "file";
    } else {
      continue;
    }
    entries.push({
      name: dirent.name,
      path: join(path, dirent.name),
      kind,
      hidden: dirent.name.startsWith(".")
    });
  }
  entries.sort((a, b) => a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "dir" ? -1 : 1);
  return { path, entries };
}
async function readLocal(path, maxBytes) {
  const stats = await stat(path);
  if (stats.isDirectory()) throw new Error("\u8FD9\u662F\u4E00\u4E2A\u76EE\u5F55\uFF0C\u8BF7\u5C55\u5F00\u540E\u9009\u62E9\u6587\u4EF6");
  if (stats.size > maxBytes) {
    throw new Error(`\u6587\u4EF6\u8FC7\u5927\uFF08${stats.size} \u5B57\u8282\uFF0C\u8D85\u8FC7 ${maxBytes} \u5B57\u8282\u4E0A\u9650\uFF09\uFF0C\u65E0\u6CD5\u5728\u9762\u677F\u4E2D\u7F16\u8F91`);
  }
  const text2 = await readFile3(path, "utf8");
  if (text2.includes("\0")) throw new Error("\u68C0\u6D4B\u5230\u4E8C\u8FDB\u5236\u5185\u5BB9\uFF0C\u65E0\u6CD5\u4EE5\u6587\u672C\u65B9\u5F0F\u7F16\u8F91");
  return text2;
}
async function writeLocal(path, content) {
  const tmp = `${path}.dsh-edit-${process.pid}-${Date.now()}`;
  try {
    await writeFile2(tmp, content, "utf8");
    await rename2(tmp, path);
  } catch (error) {
    try {
      await unlink2(tmp);
    } catch {
    }
    throw error;
  }
}
async function mkdirLocal(path) {
  await mkdir2(path, { recursive: false });
}
async function unlinkLocal(path) {
  const stats = await stat(path);
  if (stats.isDirectory()) {
    const { rmdir } = await import("node:fs/promises");
    await rmdir(path);
  } else {
    await unlink2(path);
  }
}
function serverOf(state, serverId) {
  if (serverId === null) return void 0;
  return state.servers.find((candidate) => candidate.id === serverId);
}
var SshSessionStore = class {
  /**
   * @param opTimeoutMs - deadline for one remote SFTP round trip; passed to
   *   every per-session {@link SshConnection} (see its constructor).
   */
  constructor(opTimeoutMs = 12e4) {
    this.opTimeoutMs = opTimeoutMs;
    this.ready = loadState().then(
      (state) => {
        this.state = state;
      },
      () => {
        this.state = { servers: [], defaultPref: freshPref(), sessions: {} };
      }
    );
  }
  opTimeoutMs;
  ready;
  state = null;
  runtimes = /* @__PURE__ */ new Map();
  /** Wait for the initial load and return the current state. */
  async current() {
    await this.ready;
    const state = this.state;
    if (state === null) throw new Error("ssh-files: state failed to initialize");
    return state;
  }
  /** Persist the current state. */
  async persist() {
    const state = this.state;
    if (state === null) throw new Error("ssh-files: state failed to initialize");
    await saveState(state);
  }
  /** The runtime for a session key (created lazily, never shared across keys). */
  runtimeFor(sessionId) {
    let runtime = this.runtimes.get(sessionId);
    if (runtime === void 0) {
      runtime = { conn: new SshConnection(this.opTimeoutMs) };
      this.runtimes.set(sessionId, runtime);
    }
    return runtime;
  }
  /** Write a session's durable preference (both its own row and the default). */
  async writePref(sessionId, pref) {
    const state = await this.current();
    if (sessionId !== "") state.sessions[sessionId] = { ...pref };
    state.defaultPref = { ...pref };
    await this.persist();
  }
  /** The effective tree root for a connected session's server. */
  async rootFor(state, sessionId) {
    const runtime = this.runtimeFor(sessionId);
    const server = serverOf(state, prefFor(state, sessionId === "" ? void 0 : sessionId).serverId);
    if (server !== void 0 && server.root.trim() !== "") return server.root;
    return runtime.conn.activeHome ?? "/";
  }
  /** The full wire state response for one session. */
  async response(sessionId) {
    const state = await this.current();
    const pref = prefFor(state, sessionId === "" ? void 0 : sessionId);
    const runtime = this.runtimeFor(sessionId);
    const connected = runtime.conn.connected;
    const root = connected ? await this.rootFor(state, sessionId) : null;
    return {
      state: {
        mode: pref.mode,
        serverId: pref.serverId,
        servers: state.servers,
        connected
      },
      root
    };
  }
  /** Switch one session's working mode (also remembered as the default). */
  async setMode(sessionId, mode) {
    const state = await this.current();
    const pref = prefFor(state, sessionId === "" ? void 0 : sessionId);
    await this.writePref(sessionId, { mode, serverId: pref.serverId });
    return this.response(sessionId);
  }
  /** Add a server record (id generated, shared by every session). */
  async addServer(input, sessionId = "") {
    const state = await this.current();
    state.servers.push({ ...input, id: createServerId() });
    await this.persist();
    return this.response(sessionId);
  }
  /** Replace one server record's fields. */
  async updateServer(id, input, sessionId = "") {
    const state = await this.current();
    const index = state.servers.findIndex((candidate) => candidate.id === id);
    const previous = state.servers[index];
    if (previous === void 0) throw new Error("\u670D\u52A1\u5668\u8BB0\u5F55\u4E0D\u5B58\u5728");
    state.servers[index] = { ...input, id: previous.id };
    await this.persist();
    return this.response(sessionId);
  }
  /** Remove one server record, dropping connections and prefs that target it. */
  async removeServer(id, sessionId = "") {
    const state = await this.current();
    const index = state.servers.findIndex((candidate) => candidate.id === id);
    if (index === -1) throw new Error("\u670D\u52A1\u5668\u8BB0\u5F55\u4E0D\u5B58\u5728");
    state.servers.splice(index, 1);
    for (const [runtimeSessionId, runtime] of this.runtimes) {
      if (runtime.conn.activeServer?.id !== id) continue;
      await runtime.conn.disconnect();
      const pref = prefFor(state, runtimeSessionId === "" ? void 0 : runtimeSessionId);
      if (pref.serverId === id && runtimeSessionId !== "") {
        state.sessions[runtimeSessionId] = { ...pref, serverId: null };
      }
    }
    if (state.defaultPref.serverId === id) state.defaultPref = { ...state.defaultPref, serverId: null };
    await this.persist();
    return this.response(sessionId);
  }
  /** Connect one session to a saved server; its mode becomes `ssh`. */
  async connect(sessionId, id, timeoutMs, signal) {
    const state = await this.current();
    const server = state.servers.find((candidate) => candidate.id === id);
    if (server === void 0) throw new Error("\u670D\u52A1\u5668\u8BB0\u5F55\u4E0D\u5B58\u5728");
    const runtime = this.runtimeFor(sessionId);
    const result = await runtime.conn.connect(server, timeoutMs, signal);
    await this.writePref(sessionId, { mode: "ssh", serverId: id });
    return {
      state: { mode: "ssh", serverId: id, servers: state.servers, connected: true },
      root: result.root
    };
  }
  /** Tear down one session's live connection (its preference is kept). */
  async disconnect(sessionId) {
    const state = await this.current();
    const runtime = this.runtimeFor(sessionId);
    await runtime.conn.disconnect();
    const pref = prefFor(state, sessionId === "" ? void 0 : sessionId);
    return {
      state: { mode: pref.mode, serverId: pref.serverId, servers: state.servers, connected: false },
      root: null
    };
  }
  /** Resolve a server reference (id or display name) to a record. */
  findServer(state, reference) {
    if (reference === void 0 || reference === "") return void 0;
    return state.servers.find((candidate) => candidate.id === reference) ?? state.servers.find((candidate) => candidate.name === reference);
  }
  /** The connected server of one session, throwing when not connected. */
  requireServer(sessionId) {
    const state = this.state;
    if (state === null) throw new Error("ssh-files: state failed to initialize");
    const runtime = this.runtimeFor(sessionId);
    const server = runtime.conn.activeServer;
    if (server === null) throw new Error("\u672C\u4F1A\u8BDD\u5C1A\u672A\u8FDE\u63A5\u670D\u52A1\u5668\uFF1A\u8BF7\u5148\u7528 ssh_connect \u8FDE\u63A5\uFF08\u6216\u53F3\u4FA7\u9762\u677F\u8FDE\u63A5\uFF09");
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
    const wanted = reference === void 0 || reference === "" ? serverOf(state, prefFor(state, sessionId === "" ? void 0 : sessionId).serverId) : this.findServer(state, reference);
    if (active !== null && (wanted === void 0 || active.id === wanted.id)) {
      return { conn: runtime.conn, server: active };
    }
    if (wanted === void 0) {
      throw new Error("\u627E\u4E0D\u5230\u76EE\u6807\u670D\u52A1\u5668\uFF1A\u8BF7\u63D0\u4F9B\u5DF2\u4FDD\u5B58\u670D\u52A1\u5668\u7684 id \u6216\u540D\u79F0\uFF08ssh_status \u53EF\u5217\u51FA\uFF09");
    }
    await runtime.conn.connect(wanted, timeoutMs, signal);
    await this.writePref(sessionId, { mode: "ssh", serverId: wanted.id });
    return { conn: runtime.conn, server: wanted };
  }
  /** Mode-aware directory listing for one session (panel behavior). */
  async list(sessionId, path, signal) {
    const state = await this.current();
    const pref = prefFor(state, sessionId === "" ? void 0 : sessionId);
    if (pref.mode !== "ssh") return listLocal(path);
    const runtime = this.runtimeFor(sessionId);
    if (!runtime.conn.connected) throw new Error("SSH \u6A21\u5F0F\u4E0B\u8BF7\u5148\u8FDE\u63A5\u670D\u52A1\u5668");
    return runtime.conn.list(path, signal);
  }
  /** Mode-aware text read with the configured size cap. */
  async read(sessionId, path, maxBytes, signal) {
    const state = await this.current();
    const pref = prefFor(state, sessionId === "" ? void 0 : sessionId);
    if (pref.mode !== "ssh") return readLocal(path, maxBytes);
    const runtime = this.runtimeFor(sessionId);
    if (!runtime.conn.connected) throw new Error("SSH \u6A21\u5F0F\u4E0B\u8BF7\u5148\u8FDE\u63A5\u670D\u52A1\u5668");
    return runtime.conn.read(path, maxBytes, signal);
  }
  /** Mode-aware atomic text write. */
  async write(sessionId, path, content, signal) {
    const state = await this.current();
    const pref = prefFor(state, sessionId === "" ? void 0 : sessionId);
    if (pref.mode !== "ssh") return writeLocal(path, content);
    const runtime = this.runtimeFor(sessionId);
    if (!runtime.conn.connected) throw new Error("SSH \u6A21\u5F0F\u4E0B\u8BF7\u5148\u8FDE\u63A5\u670D\u52A1\u5668");
    return runtime.conn.write(path, content, signal);
  }
  /** Mode-aware directory creation. */
  async mkdir(sessionId, path, signal) {
    const state = await this.current();
    const pref = prefFor(state, sessionId === "" ? void 0 : sessionId);
    if (pref.mode !== "ssh") return mkdirLocal(path);
    const runtime = this.runtimeFor(sessionId);
    if (!runtime.conn.connected) throw new Error("SSH \u6A21\u5F0F\u4E0B\u8BF7\u5148\u8FDE\u63A5\u670D\u52A1\u5668");
    return runtime.conn.mkdir(path, signal);
  }
  /** Mode-aware file/directory deletion. */
  async unlink(sessionId, path, signal) {
    const state = await this.current();
    const pref = prefFor(state, sessionId === "" ? void 0 : sessionId);
    if (pref.mode !== "ssh") return unlinkLocal(path);
    const runtime = this.runtimeFor(sessionId);
    if (!runtime.conn.connected) throw new Error("SSH \u6A21\u5F0F\u4E0B\u8BF7\u5148\u8FDE\u63A5\u670D\u52A1\u5668");
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
      throw new Error("\u672C\u4F1A\u8BDD\u5C1A\u672A\u8FDE\u63A5\u670D\u52A1\u5668\uFF1A\u8BF7\u5148\u7528 ssh_connect \u8FDE\u63A5\uFF08\u6216\u53F3\u4FA7\u9762\u677F\u8FDE\u63A5\uFF09");
    }
    return runtime.conn;
  }
  /** Tear down every live connection (host teardown). */
  async dispose() {
    await Promise.all([...this.runtimes.values()].map((runtime) => runtime.conn.disconnect()));
    this.runtimes.clear();
  }
};

// src/tools.ts
import { defineTool } from "@deepseek-ai/dsh-tools";
function sessionKeyOf(exec) {
  const id = exec.agent?.id;
  return typeof id === "string" && id.length > 0 ? id : "";
}
var text = (value) => [{ type: "text", text: value }];
function registerSshTools(ctx, store, caps) {
  const tools = ctx.tools;
  tools.register(defineTool({
    name: "ssh_status",
    description: "Report this conversation's SSH working state: every saved server (id, name, host) and which one this session is connected to (with its home). Use this first to learn the server ids for ssh_connect and the current connection.",
    parameters: {},
    output: {
      schema: { type: "string" },
      render: (_args, value) => text(value)
    },
    async execute(_args, exec) {
      const state = await store.response(sessionKeyOf(exec));
      const connected = state.state.connected;
      const server = connected ? state.state.servers.find((candidate) => candidate.id === state.state.serverId) : void 0;
      const lines = [
        `\u5DF2\u4FDD\u5B58\u670D\u52A1\u5668 ${state.state.servers.length} \u53F0\uFF1A`,
        ...state.state.servers.map((item) => `- ${item.id}  ${item.name}  (${item.username}@${item.host}:${item.port})`),
        connected && server !== void 0 ? `\u672C\u4F1A\u8BDD\u5DF2\u8FDE\u63A5\uFF1A${server.id}\uFF08${server.name}\uFF09` : "\u672C\u4F1A\u8BDD\u672A\u8FDE\u63A5\uFF08\u7528 ssh_connect \u8FDE\u63A5\uFF09"
      ];
      return lines.join("\n");
    }
  }));
  tools.register(defineTool({
    name: "ssh_connect",
    description: "Connect this conversation's session to a saved server over SSH/SFTP. Pass the server id or display name from ssh_status. After this, ssh_list / ssh_read / ssh_write / ssh_exec operate on that server for this session only.",
    parameters: {
      server: { type: "string", description: "Saved server id or display name (see ssh_status)." }
    },
    output: {
      schema: { type: "string" },
      render: (_args, value) => text(value)
    },
    async execute(args, exec) {
      const sessionId = sessionKeyOf(exec);
      const reference = args.server;
      const { server } = await store.ensureConnected(
        sessionId,
        typeof reference === "string" ? reference : void 0,
        caps.connectTimeoutMs,
        exec.signal
      );
      return `\u5DF2\u8FDE\u63A5 ${server.name}\uFF08${server.username}@${server.host}\uFF09`;
    }
  }));
  tools.register(defineTool({
    name: "ssh_disconnect",
    description: "Disconnect this conversation's session from its current SSH server. The saved server record and preference are kept.",
    parameters: {},
    output: {
      schema: { type: "string" },
      render: (_args, value) => text(value)
    },
    async execute(_args, exec) {
      const state = await store.disconnect(sessionKeyOf(exec));
      const name2 = state.state.servers.find((item) => item.id === state.state.serverId)?.name ?? "";
      return name2 !== "" ? `\u5DF2\u65AD\u5F00 ${name2}\u3002` : "\u672C\u4F1A\u8BDD\u672A\u8FDE\u63A5\u3002";
    }
  }));
  tools.register(defineTool({
    name: "ssh_list",
    description: "List one directory on this conversation's connected SSH server. The tree is like a local readdir: directories first, then files, each name-sorted.",
    parameters: {
      path: { type: "string", required: true, description: "Absolute remote directory to list (e.g. /home/user or /)." }
    },
    output: {
      schema: { type: "string" },
      render: (_args, value) => text(value)
    },
    async execute(args, exec) {
      const conn = store.requireConnectedFor(sessionKeyOf(exec));
      const path = args.path;
      const listing = await conn.list(path, exec.signal);
      const rows = listing.entries.map((entry) => `${entry.kind === "dir" ? "dir " : "file"} ${entry.path}${entry.hidden ? "  (hidden)" : ""}`);
      return rows.length > 0 ? rows.join("\n") : "\uFF08\u7A7A\u76EE\u5F55\uFF09";
    }
  }));
  tools.register(defineTool({
    name: "ssh_read",
    description: "Read a UTF-8 text file on this conversation's connected SSH server and return numbered lines. Use offset/limit to page through large files. Binary or oversized files are rejected.",
    parameters: {
      path: { type: "string", required: true, description: "Absolute remote file path." },
      offset: { type: "number", description: "1-based first line to return. Defaults to 1." },
      limit: { type: "number", description: `Maximum number of lines to return. Defaults to ${caps.readMaxLines}.` }
    },
    output: {
      schema: { type: "string" },
      render: (_args, value) => text(value)
    },
    async execute(args, exec) {
      const conn = store.requireConnectedFor(sessionKeyOf(exec));
      const input = args;
      const content = await conn.read(input.path, caps.readMaxBytes, exec.signal);
      const lines = content.split("\n");
      const total = lines.length;
      const offset = typeof input.offset === "number" && Number.isFinite(input.offset) && input.offset >= 1 ? Math.floor(input.offset) : 1;
      const limit = typeof input.limit === "number" && Number.isFinite(input.limit) && input.limit >= 1 ? Math.floor(input.limit) : caps.readMaxLines;
      const slice = lines.slice(offset - 1, offset - 1 + limit);
      const width = String(offset - 1 + slice.length).length;
      const body = slice.map((lineText, index) => `${String(offset + index).padStart(width)} | ${lineText}`).join("\n");
      const truncated = offset - 1 + slice.length < total;
      return `<path>${input.path}</path>
<type>file</type>
<content>
${body}
</content>
${truncated ? `\uFF08\u5171 ${total} \u884C\uFF0C\u5DF2\u663E\u793A ${offset}-${offset - 1 + slice.length} \u884C\uFF1B\u7528 offset=${offset + slice.length} \u7EE7\u7EED\uFF09` : `\u5171 ${total} \u884C`}`;
    }
  }));
  tools.register(defineTool({
    name: "ssh_write",
    description: "Write (create or overwrite) one UTF-8 text file on this conversation's connected SSH server, atomically (temp + rename). Parent directories must exist; create them with ssh_mkdir.",
    parameters: {
      path: { type: "string", required: true, description: "Absolute remote file path." },
      content: { type: "string", required: true, description: "Full text content to write." }
    },
    output: {
      schema: { type: "string" },
      render: (_args, value) => text(value)
    },
    async execute(args, exec) {
      const conn = store.requireConnectedFor(sessionKeyOf(exec));
      const input = args;
      if (input.content.length > caps.writeMaxChars) {
        throw new Error(`\u5185\u5BB9\u8FC7\u957F\uFF08${input.content.length} \u5B57\u7B26\uFF0C\u4E0A\u9650 ${caps.writeMaxChars}\uFF09\uFF1A\u8BF7\u5206\u6279\u6216\u6539\u7528 ssh_exec \u5904\u7406`);
      }
      await conn.write(input.path, input.content, exec.signal);
      return `\u5DF2\u5199\u5165 ${input.path}`;
    }
  }));
  tools.register(defineTool({
    name: "ssh_mkdir",
    description: "Create one directory on this conversation's connected SSH server (parent must exist).",
    parameters: {
      path: { type: "string", required: true, description: "Absolute remote directory path." }
    },
    output: {
      schema: { type: "string" },
      render: (_args, value) => text(value)
    },
    async execute(args, exec) {
      const conn = store.requireConnectedFor(sessionKeyOf(exec));
      await conn.mkdir(args.path, exec.signal);
      return "\u5DF2\u521B\u5EFA\u76EE\u5F55";
    }
  }));
  tools.register(defineTool({
    name: "ssh_rm",
    description: "Delete one file or (empty) directory on this conversation's connected SSH server. Use with care \u2014 this is not reversible.",
    parameters: {
      path: { type: "string", required: true, description: "Absolute remote path to delete." }
    },
    output: {
      schema: { type: "string" },
      render: (_args, value) => text(value)
    },
    async execute(args, exec) {
      const conn = store.requireConnectedFor(sessionKeyOf(exec));
      await conn.unlink(args.path, exec.signal);
      return "\u5DF2\u5220\u9664";
    }
  }));
  tools.register(defineTool({
    name: "ssh_exec",
    description: "Run one shell command on this conversation's connected SSH server and return its exit code plus captured stdout/stderr. The remote login shell parses the command (POSIX syntax on typical servers). Use this for work ssh_list/ssh_read/ssh_write cannot do (git, package managers, scripts).",
    parameters: {
      command: { type: "string", required: true, description: "The command line to run remotely." },
      cwd: { type: "string", description: "Optional remote working directory to cd into first." }
    },
    output: {
      schema: { type: "string" },
      render: (_args, value) => text(value)
    },
    async execute(args, exec) {
      const conn = store.requireConnectedFor(sessionKeyOf(exec));
      const input = args;
      const outcome = await conn.exec(
        input.command,
        // exactOptionalPropertyTypes: omit cwd rather than passing undefined.
        input.cwd !== void 0 ? { cwd: input.cwd, maxChars: caps.execMaxChars } : { maxChars: caps.execMaxChars },
        exec.signal
      );
      const lines = [`$ ${input.cwd !== void 0 ? `cd ${input.cwd} && ` : ""}${input.command}`];
      if (outcome.stdout !== "") lines.push(outcome.stdout);
      if (outcome.stderr !== "") lines.push(`[stderr]
${outcome.stderr}`);
      lines.push(outcome.code === 0 ? "[exit 0]" : `[exit ${String(outcome.code)}] \u2014 \u547D\u4EE4\u975E\u96F6\u9000\u51FA\uFF0C\u8BF7\u68C0\u67E5\u4E0A\u9762\u7684\u9519\u8BEF\u8F93\u51FA`);
      return lines.join("\n");
    }
  }));
  ctx.systemPrompt.section({
    name: "tool:ssh-files",
    order: 100,
    text: "SSH \u5DE5\u5177\uFF08ssh_status / ssh_connect / ssh_list / ssh_read / ssh_write / ssh_mkdir / ssh_rm / ssh_exec\uFF09\u4F5C\u7528\u4E8E\u672C\u5BF9\u8BDD\u5404\u81EA\u8BB0\u4F4F\u7684\u670D\u52A1\u5668\uFF0C\u4E0E\u4F1A\u8BDD\u9694\u79BB\uFF1A\u6BCF\u4E2A\u5BF9\u8BDD\u72EC\u7ACB\u8FDE\u63A5\u3001\u4E92\u4E0D\u5F71\u54CD\u3002\u9700\u8981\u64CD\u4F5C\u8FDC\u7A0B\u670D\u52A1\u5668\u65F6\uFF0C\u5148 ssh_status \u67E5\u770B\u53EF\u7528\u670D\u52A1\u5668\uFF0C\u518D ssh_connect \u8FDE\u63A5\uFF08\u6216\u6CBF\u7528\u672C\u4F1A\u8BDD\u5DF2\u8FDE\u7684\uFF09\uFF0C\u7136\u540E\u4F7F\u7528 ssh_* \u5DE5\u5177\u3002\u672C\u5730\u6587\u4EF6\u4ECD\u7528 read/write \u7B49\u5185\u7F6E\u5DE5\u5177\u3002"
  });
}

// src/index.ts
var Config = z.object({
  readMaxBytes: z.number().default(1024 * 1024),
  connectTimeoutMs: z.number().default(15e3),
  opTimeoutMs: z.number().default(12e4),
  writeMaxChars: z.number().default(2e5),
  readMaxLines: z.number().default(2e3),
  execMaxChars: z.number().default(2e4),
  code: z.string().default("code"),
  marktext: z.string().default("marktext")
});
var name = "ssh-files";
var inject = ["connection", "tools", "systemPrompt"];
function sessionKeyOf2(payload) {
  if (typeof payload === "object" && payload !== null) {
    const value = payload.sessionId;
    return typeof value === "string" && value.length > 0 ? value : "";
  }
  return "";
}
function parseMode(payload) {
  if (typeof payload !== "object" || payload === null) return void 0;
  const mode = payload.mode;
  return mode === "local" || mode === "ssh" ? mode : void 0;
}
function parseStringField(payload, key) {
  if (typeof payload !== "object" || payload === null) return void 0;
  const value = payload[key];
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function parseOptionalString(payload, key) {
  if (typeof payload !== "object" || payload === null) return void 0;
  const value = payload[key];
  return typeof value === "string" ? value : void 0;
}
function parseServerInput(payload) {
  if (typeof payload !== "object" || payload === null) throw new Error("\u670D\u52A1\u5668\u4FE1\u606F\u683C\u5F0F\u65E0\u6548");
  const record = payload;
  const name2 = parseStringField(record, "name");
  const host = parseStringField(record, "host");
  const username = parseOptionalString(record, "username");
  const root = parseOptionalString(record, "root") ?? "";
  const auth = record.auth;
  if (name2 === void 0) throw new Error("\u8BF7\u586B\u5199\u670D\u52A1\u5668\u540D\u79F0");
  if (host === void 0) throw new Error("\u8BF7\u586B\u5199\u4E3B\u673A\u5730\u5740");
  if (username === void 0 || username === "") throw new Error("\u8BF7\u586B\u5199\u767B\u5F55\u7528\u6237\u540D");
  if (auth !== "password" && auth !== "key" && auth !== "agent") throw new Error("\u8BA4\u8BC1\u65B9\u5F0F\u65E0\u6548");
  const port = record.port;
  if (typeof port !== "number" || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("\u7AEF\u53E3\u5FC5\u987B\u662F 1-65535 \u7684\u6574\u6570");
  }
  const input = {
    name: name2,
    host,
    port,
    username,
    auth,
    root
  };
  const password = parseOptionalString(record, "password");
  if (password !== void 0) input.password = password;
  const keyPath = parseOptionalString(record, "keyPath");
  if (keyPath !== void 0) input.keyPath = keyPath;
  return input;
}
function powershellLiteral(value) {
  return `'${value.replace(/'/g, "''")}'`;
}
var NOT_FOUND_RE = /not (recognized|found)|CommandNotFound|无法将.+识别为|不是内部或外部命令/;
async function runOpener(command, path, signal) {
  try {
    if (process.platform === "win32") {
      await runNativeCommand(
        "powershell.exe",
        ["-NoProfile", "-Command", `& ${powershellLiteral(command)} ${powershellLiteral(path)}`],
        signal
      );
    } else {
      await runNativeCommand(command, [path], signal);
    }
  } catch (error) {
    if (signal.aborted) throw error;
    const message = error instanceof Error ? error.message : String(error);
    if (error?.code === "ENOENT" || NOT_FOUND_RE.test(message)) {
      throw new Error(
        `\u627E\u4E0D\u5230\u53EF\u6267\u884C\u7A0B\u5E8F "${command}"\uFF1A\u8BF7\u786E\u8BA4\u5DF2\u5B89\u88C5\u5E76\u52A0\u5165 PATH\uFF0C\u6216\u5728\u63D2\u4EF6\u914D\u7F6E\uFF08cordis.patch.yml \u7684 ssh-files \u884C\uFF09\u4E2D\u586B\u5199\u5B8C\u6574\u8DEF\u5F84`
      );
    }
    throw error instanceof Error ? error : new Error(message);
  }
}
var ROUTE_PATH = "/ssh-files";
var MAX_BODY_BYTES = 32 * 1024 * 1024;
async function openWithDefaultApp(path, signal) {
  if (process.platform === "win32") {
    await runNativeCommand(
      "powershell.exe",
      ["-NoProfile", "-Command", `Start-Process -FilePath ${powershellLiteral(path)}`],
      signal
    );
    return;
  }
  await runNativeCommand(process.platform === "darwin" ? "open" : "xdg-open", [path], signal);
}
async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = chunk;
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error("request body exceeds the route limit");
    chunks.push(buffer);
  }
  if (chunks.length === 0) return void 0;
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
function writeJson(response, status, body) {
  if (response.writableEnded || response.destroyed) return;
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload)
  });
  response.end(payload);
}
function apply(ctx, config) {
  const resolved = config;
  const store = new SshSessionStore(resolved.opTimeoutMs);
  ctx.effect(() => () => {
    void store.dispose();
  }, "ssh-files: session teardown");
  registerSshTools(ctx, store, {
    connectTimeoutMs: resolved.connectTimeoutMs,
    readMaxBytes: resolved.readMaxBytes,
    writeMaxChars: resolved.writeMaxChars,
    readMaxLines: resolved.readMaxLines,
    execMaxChars: resolved.execMaxChars
  });
  const handler = async (endpoint, payload, signal) => {
    try {
      const session = sessionKeyOf2(payload);
      switch (endpoint) {
        case "get-state":
          return { ok: true, value: await store.response(session) };
        case "set-mode": {
          const mode = parseMode(payload);
          if (mode === void 0) throw new Error("\u5DE5\u4F5C\u65B9\u5F0F\u65E0\u6548\uFF1A\u4EC5\u652F\u6301 local \u4E0E ssh");
          return { ok: true, value: await store.setMode(session, mode) };
        }
        case "add-server":
          return { ok: true, value: await store.addServer(parseServerInput(payload), session) };
        case "update-server": {
          const record = payload ?? {};
          const id = parseStringField(record, "id");
          if (id === void 0) throw new Error("\u7F3A\u5C11\u670D\u52A1\u5668 id");
          return { ok: true, value: await store.updateServer(id, parseServerInput(record.server), session) };
        }
        case "remove-server": {
          const id = parseStringField(payload, "id");
          if (id === void 0) throw new Error("\u7F3A\u5C11\u670D\u52A1\u5668 id");
          return { ok: true, value: await store.removeServer(id, session) };
        }
        case "connect": {
          const id = parseStringField(payload, "id");
          if (id === void 0) throw new Error("\u7F3A\u5C11\u670D\u52A1\u5668 id");
          return { ok: true, value: await store.connect(session, id, resolved.connectTimeoutMs, signal) };
        }
        case "disconnect":
          return { ok: true, value: await store.disconnect(session) };
        case "list": {
          const path = parseStringField(payload, "path");
          if (path === void 0) throw new Error("\u7F3A\u5C11\u76EE\u5F55\u8DEF\u5F84");
          return { ok: true, value: await store.list(session, path, signal) };
        }
        case "read": {
          const path = parseStringField(payload, "path");
          if (path === void 0) throw new Error("\u7F3A\u5C11\u6587\u4EF6\u8DEF\u5F84");
          const content = await store.read(session, path, resolved.readMaxBytes, signal);
          return { ok: true, value: { content } };
        }
        case "write": {
          const record = payload ?? {};
          const path = parseStringField(record, "path");
          const content = record.content;
          if (path === void 0) throw new Error("\u7F3A\u5C11\u6587\u4EF6\u8DEF\u5F84");
          if (typeof content !== "string") throw new Error("\u7F3A\u5C11\u6587\u4EF6\u5185\u5BB9");
          await store.write(session, path, content, signal);
          return { ok: true, value: { written: true } };
        }
        case "mkdir": {
          const path = parseStringField(payload, "path");
          if (path === void 0) throw new Error("\u7F3A\u5C11\u76EE\u5F55\u8DEF\u5F84");
          await store.mkdir(session, path, signal);
          return { ok: true, value: { created: true } };
        }
        case "unlink": {
          const path = parseStringField(payload, "path");
          if (path === void 0) throw new Error("\u7F3A\u5C11\u8DEF\u5F84");
          await store.unlink(session, path, signal);
          return { ok: true, value: { removed: true } };
        }
        case "open-local": {
          const record = payload ?? {};
          const path = parseStringField(record, "path");
          const command = record.command;
          if (path === void 0) throw new Error("\u7F3A\u5C11\u6587\u4EF6\u8DEF\u5F84");
          if (command !== "code" && command !== "marktext" && command !== "default") throw new Error("\u7F3A\u5C11\u6253\u5F00\u65B9\u5F0F");
          if (command === "default") await openWithDefaultApp(path, signal);
          else {
            await runOpener(
              command === "code" ? resolved.code : resolved.marktext,
              path,
              signal
            );
          }
          return { ok: true, value: { opened: true } };
        }
        default:
          throw new Error(`\u672A\u77E5\u7AEF\u70B9 ${endpoint}`);
      }
    } catch (error) {
      if (signal.aborted) {
        return { ok: false, error: { code: "cancelled", message: "\u64CD\u4F5C\u5DF2\u53D6\u6D88", details: {} } };
      }
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, error: { code: "internal", message, details: {} } };
    }
  };
  ctx.inject(["webServer", "connection"], (webCtx) => {
    const settle = (response, status, result) => {
      writeJson(response, status, result.ok ? { ok: true, value: result.value } : { ok: false, error: { message: result.message } });
    };
    const route = {
      kind: "prefix",
      path: ROUTE_PATH,
      handler: async (request, response) => {
        const rejection = webCtx.connection.requestRejection(request);
        if (rejection !== void 0) {
          response.writeHead(rejection);
          response.end(rejection === 401 ? "unauthorized" : "forbidden");
          return;
        }
        if (request.method !== "POST") {
          settle(response, 405, { ok: false, message: "ssh-files: this route accepts POST only" });
          return;
        }
        const endpoint = new URL(request.url ?? "/", "http://127.0.0.1").pathname.slice(ROUTE_PATH.length + 1);
        let payload;
        try {
          payload = await readJsonBody(request);
        } catch (error) {
          settle(response, 400, {
            ok: false,
            message: `ssh-files: malformed request body: ${error instanceof Error ? error.message : String(error)}`
          });
          return;
        }
        const controller = new AbortController();
        response.once("close", () => {
          if (!response.writableEnded) controller.abort();
        });
        const result = await handler(endpoint, payload, controller.signal);
        settle(response, result.ok ? 200 : 500, result.ok ? { ok: true, value: result.value } : { ok: false, message: result.error.message });
      }
    };
    webCtx.effect(() => webCtx.webServer.register(route), "ssh-files: route");
  });
}
export {
  Config,
  SshSessionStore,
  apply,
  inject,
  name
};
