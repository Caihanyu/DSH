// plugins/dsh-workspace-files/src/index.ts
import { readdir } from "node:fs/promises";
import { join as join2 } from "node:path";
import { runNativeCommand as runNativeCommand2 } from "@deepseek-ai/dsh-native-command";
import z from "@deepseek-ai/schemastery";

// plugins/dsh-workspace-files/src/setup.ts
import { access, mkdir, opendir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { runNativeCommand } from "@deepseek-ai/dsh-native-command";
var SKIP_DIRECTORIES = /* @__PURE__ */ new Set([
  "windows",
  "winsxs",
  "windowsapps",
  "system volume information",
  "$recycle.bin",
  "recovery",
  "perflogs",
  "node_modules",
  ".git",
  ".pnpm",
  ".cache",
  ".vscode",
  "temp",
  "tmp",
  "packages",
  "installer",
  "windows.old",
  "$windows.~ws",
  "$windows.~bt",
  "driverstore",
  "assembly",
  "servicing",
  "softwaredistribution"
]);
function driveRoots() {
  if (process.platform !== "win32") return ["/"];
  const roots = [];
  for (const letter of "CDEFGHIJKL".split("")) roots.push(`${letter}:\\`);
  return roots;
}
async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
function harnessHome() {
  const configured = process.env.DSH_HOME;
  if (typeof configured === "string" && configured.trim() !== "") return configured.trim();
  return join(homedir(), ".dsh");
}
function stateFilePath() {
  return join(harnessHome(), "workspace-files", "config.json");
}
async function loadState() {
  try {
    const raw = await readFile(stateFilePath(), "utf8");
    const parsed = JSON.parse(raw);
    const status = parsed.status;
    if (status !== "pending" && status !== "ready" && status !== "off") return freshState();
    return { version: 1, status, apps: parseApps(parsed.apps) };
  } catch {
    return freshState();
  }
}
function freshState() {
  return { version: 1, status: "pending", apps: {} };
}
function parseApps(input) {
  const apps = {};
  if (typeof input !== "object" || input === null) return apps;
  for (const slot of ["markdown", "code", "office"]) {
    const raw = input[slot];
    if (typeof raw !== "object" || raw === null) continue;
    const entry = raw;
    if (typeof entry.id !== "string" || typeof entry.label !== "string" || typeof entry.command !== "string" || entry.command.length === 0) continue;
    apps[slot] = { id: entry.id, label: entry.label, command: entry.command, enabled: entry.enabled === true };
  }
  return apps;
}
async function saveState(state) {
  const file = stateFilePath();
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(state, null, 2)}
`, "utf8");
}
var CANDIDATES = [
  {
    id: "typora",
    slot: "markdown",
    label: "Typora",
    exeName: "typora.exe",
    pathNames: ["typora"],
    registry: /typora/i
  },
  {
    id: "marktext",
    slot: "markdown",
    label: "MarkText",
    exeName: "marktext.exe",
    pathNames: ["marktext"],
    registry: /marktext/i
  },
  {
    id: "vscode",
    slot: "code",
    label: "VS Code",
    exeName: "code.exe",
    pathNames: ["code"],
    registry: /visual studio code|vscode|vs code/i,
    validate: (directory) => /visual studio code|vscode|vs ?code/i.test(directory)
  },
  {
    id: "wps",
    slot: "office",
    label: "WPS Office",
    exeName: "wps.exe",
    pathNames: ["wps"],
    registry: /wps office|kingsoft|金山/i,
    validate: (directory) => /office6|kingsoft|wps/i.test(directory)
  }
];
function staticLocations(candidate) {
  const home = process.env.USERPROFILE ?? homedir();
  const local = process.env.LOCALAPPDATA ?? join(home, "AppData", "Local");
  const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";
  const paths = [];
  if (candidate.id === "typora") {
    paths.push(
      join(local, "Programs", "Typora", "Typora.exe"),
      join(programFiles, "Typora", "Typora.exe"),
      join(programFilesX86, "Typora", "Typora.exe"),
      join(home, "scoop", "apps", "typora", "current", "Typora.exe")
    );
  } else if (candidate.id === "marktext") {
    paths.push(
      join(local, "Programs", "marktext", "MarkText.exe"),
      join(local, "Programs", "MarkText", "MarkText.exe"),
      join(programFiles, "MarkText", "MarkText.exe"),
      join(programFilesX86, "MarkText", "MarkText.exe"),
      join(home, "scoop", "apps", "marktext", "current", "MarkText.exe")
    );
  } else if (candidate.id === "vscode") {
    paths.push(
      join(local, "Programs", "Microsoft VS Code", "Code.exe"),
      join(programFiles, "Microsoft VS Code", "Code.exe"),
      join(programFilesX86, "Microsoft VS Code", "Code.exe"),
      join(home, "scoop", "apps", "vscode", "current", "Code.exe")
    );
  } else {
    paths.push(
      join(local, "Kingsoft", "WPS Office"),
      join(programFiles, "Kingsoft", "WPS Office"),
      join(programFilesX86, "Kingsoft", "WPS Office"),
      join(local, "Kingsoft", "WPSOffice")
    );
  }
  if (process.platform === "win32") {
    for (const root of driveRoots()) {
      if (candidate.id === "typora") paths.push(join(root, "Typora", "Typora", "Typora.exe"), join(root, "Typora", "Typora.exe"));
      else if (candidate.id === "marktext") paths.push(join(root, "MarkText", "MarkText.exe"), join(root, "MarkText", "MarkText-x64.exe"));
      else if (candidate.id === "vscode") paths.push(join(root, "Microsoft VS Code", "Code.exe"), join(root, "VSCode", "Code.exe"), join(root, "Program Files", "Microsoft VS Code", "Code.exe"));
      else paths.push(join(root, "WPS Office"), join(root, "Kingsoft", "WPS Office"));
    }
  }
  return paths;
}
async function resolveWpsVersionRoot(root) {
  try {
    const handle = await opendir(root);
    for await (const entry of handle) {
      if (!entry.isDirectory()) continue;
      const candidate = join(root, entry.name, "office6", "wps.exe");
      if (await pathExists(candidate)) return candidate;
    }
  } catch {
    return void 0;
  }
  return void 0;
}
var REGISTRY_PROBE = [
  "$out = @()",
  "$keys = @('HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',",
  "  'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',",
  "  'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*')",
  "foreach ($k in $keys) {",
  "  Get-ItemProperty $k -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName } | ForEach-Object {",
  "    $out += [pscustomobject]@{ name = $_.DisplayName; target = $_.InstallLocation; icon = $_.DisplayIcon }",
  "  }",
  "}",
  "$paths = @('HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths', 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths')",
  "foreach ($p in $paths) {",
  "  Get-ChildItem $p -ErrorAction SilentlyContinue | ForEach-Object {",
  "    $value = (Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue).'(default)'",
  '    if ($value) { $out += [pscustomobject]@{ name = $_.PSChildName; target = $value; icon = "" } }',
  "  }",
  "}",
  "ConvertTo-Json -InputObject $out -Compress -Depth 3"
].join("; ");
async function readRegistry(signal) {
  if (process.platform !== "win32") return [];
  try {
    const result = await runNativeCommand("powershell.exe", ["-NoProfile", "-Command", REGISTRY_PROBE], signal);
    const text = (result.stdout ?? "").trim();
    if (text === "") return [];
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return rows.filter((row) => typeof row?.name === "string");
  } catch {
    return [];
  }
}
function iconPath(value) {
  const match = /^"?([^",]+\.exe)"?/.exec(value.trim());
  return match === void 0 ? void 0 : match[1];
}
async function resolvesOnPath(name2, signal) {
  if (process.platform !== "win32") {
    try {
      const result = await runNativeCommand("which", [name2], signal);
      const found = (result.stdout ?? "").trim().split(/\r?\n/)[0];
      return found === "" ? void 0 : found;
    } catch {
      return void 0;
    }
  }
  const probe = `$c = Get-Command -Name '${name2}' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1; if ($c) { $c.Source }`;
  try {
    const result = await runNativeCommand("powershell.exe", ["-NoProfile", "-Command", probe], signal);
    const found = (result.stdout ?? "").trim();
    return found === "" ? void 0 : found;
  } catch {
    return void 0;
  }
}
async function searchInstallLocation(root, candidate) {
  if (root === "") return void 0;
  const direct = [root, join(root, candidate.exeName), join(root, candidate.label), join(root, candidate.label, candidate.exeName)];
  for (const candidatePath of direct) {
    if (candidatePath.toLowerCase().endsWith(".exe") && await pathExists(candidatePath)) return candidatePath;
  }
  if (candidate.id === "wps") {
    const nested = await resolveWpsVersionRoot(root);
    if (nested !== void 0) return nested;
  }
  try {
    const handle = await opendir(root);
    for await (const entry of handle) {
      if (!entry.isDirectory()) continue;
      const nested = join(root, entry.name, candidate.exeName);
      if (await pathExists(nested)) return nested;
    }
  } catch {
    return void 0;
  }
  return void 0;
}
var DEEP_SCAN_BUDGET_MS = 9e4;
var DEEP_SCAN_MAX_DIRECTORIES = 12e4;
async function deepScan(targets, found, signal) {
  const queue = driveRoots().filter((root) => existsSync(root));
  const deadline = Date.now() + DEEP_SCAN_BUDGET_MS;
  let visited = 0;
  while (queue.length > 0 && targets.size > 0) {
    if (signal.aborted) return "cancelled";
    if (Date.now() > deadline) return "time budget reached";
    if (visited >= DEEP_SCAN_MAX_DIRECTORIES) return "directory budget reached";
    const directory = queue.shift();
    visited += 1;
    let handle;
    try {
      handle = await opendir(directory);
    } catch {
      continue;
    }
    try {
      for await (const entry of handle) {
        if (signal.aborted) return "cancelled";
        const lower = entry.name.toLowerCase();
        if (entry.isDirectory()) {
          if (SKIP_DIRECTORIES.has(lower) || entry.name.startsWith("$")) continue;
          queue.push(join(directory, entry.name));
          continue;
        }
        if (!entry.isFile()) continue;
        const candidate = targets.get(lower);
        if (candidate === void 0) continue;
        if (candidate.validate !== void 0 && !candidate.validate(directory)) continue;
        found.set(candidate.id, join(directory, entry.name));
        targets.delete(lower);
      }
    } catch {
      continue;
    }
  }
  return void 0;
}
async function scanApps(options) {
  const { configured = {}, deep, signal } = options;
  const found = /* @__PURE__ */ new Map();
  const missing = new Set(CANDIDATES.map((candidate) => candidate.id));
  for (const candidate of CANDIDATES) {
    const configuredValue = configured[candidate.slot];
    if (configuredValue === void 0 || configuredValue.trim() === "") continue;
    const value = configuredValue.trim();
    if (await pathExists(value)) {
      found.set(candidate.id, { id: candidate.id, slot: candidate.slot, label: candidate.label, command: value, source: "config" });
      missing.delete(candidate.id);
    }
  }
  for (const candidate of CANDIDATES) {
    if (!missing.has(candidate.id)) continue;
    for (const name2 of candidate.pathNames) {
      const resolved = await resolvesOnPath(name2, signal);
      if (resolved === void 0) continue;
      found.set(candidate.id, { id: candidate.id, slot: candidate.slot, label: candidate.label, command: resolved, source: "path" });
      missing.delete(candidate.id);
      break;
    }
  }
  for (const candidate of CANDIDATES) {
    if (!missing.has(candidate.id)) continue;
    for (const location of staticLocations(candidate)) {
      if (candidate.exeName !== "" && location.toLowerCase().endsWith(".exe")) {
        if (await pathExists(location)) {
          found.set(candidate.id, { id: candidate.id, slot: candidate.slot, label: candidate.label, command: location, source: "location" });
          missing.delete(candidate.id);
          break;
        }
        continue;
      }
      if (candidate.id === "wps" && await pathExists(location)) {
        const nested = await resolveWpsVersionRoot(location);
        if (nested !== void 0) {
          found.set(candidate.id, { id: candidate.id, slot: candidate.slot, label: candidate.label, command: nested, source: "location" });
          missing.delete(candidate.id);
          break;
        }
      }
    }
  }
  if (missing.size > 0) {
    const rows = await readRegistry(signal);
    for (const candidate of CANDIDATES) {
      if (!missing.has(candidate.id)) continue;
      for (const row of rows) {
        if (!candidate.registry.test(row.name)) continue;
        const icon = row.icon === "" || row.icon === void 0 ? void 0 : iconPath(row.icon);
        const fromIcon = icon !== void 0 && icon.toLowerCase().endsWith(".exe") && await pathExists(icon) ? icon : void 0;
        const fromLocation = fromIcon ?? await searchInstallLocation(row.target ?? "", candidate);
        const resolved = fromLocation ?? (row.target !== void 0 && row.target.toLowerCase().endsWith(".exe") && await pathExists(row.target) ? row.target : void 0);
        if (resolved === void 0) continue;
        found.set(candidate.id, { id: candidate.id, slot: candidate.slot, label: candidate.label, command: resolved, source: "registry" });
        missing.delete(candidate.id);
        break;
      }
    }
  }
  let truncated;
  if (deep && missing.size > 0) {
    const targets = /* @__PURE__ */ new Map();
    for (const candidate of CANDIDATES) {
      if (missing.has(candidate.id)) targets.set(candidate.exeName, candidate);
    }
    const hits = /* @__PURE__ */ new Map();
    truncated = await deepScan(targets, hits, signal);
    for (const [id, command] of hits) {
      const candidate = CANDIDATES.find((entry) => entry.id === id);
      found.set(id, { id, slot: candidate.slot, label: candidate.label, command, source: "scan" });
      missing.delete(id);
    }
  }
  return { found: [...found.values()], truncated: truncated ?? "" };
}
function parseState(input) {
  if (typeof input !== "object" || input === null) return void 0;
  const record = input;
  const status = record.status;
  if (status !== "pending" && status !== "ready" && status !== "off") return void 0;
  const apps = parseApps(record.apps);
  const usable = Object.values(apps).filter((entry) => entry.enabled && entry.command.trim() !== "");
  return { version: 1, status: status === "ready" && usable.length === 0 ? "off" : status, apps };
}

// plugins/dsh-workspace-files/src/index.ts
var Config = z.object({
  code: z.string().default("code"),
  typora: z.string().default("typora"),
  marktext: z.string().default("marktext")
});
var CANDIDATE_LABELS = {
  typora: "Typora",
  marktext: "MarkText",
  vscode: "VS Code",
  wps: "WPS Office"
};
function configuredSeed(config) {
  return {
    typora: config.typora.trim(),
    marktext: config.marktext.trim(),
    vscode: config.code.trim()
  };
}
async function resolveConfiguredValue(value, signal) {
  if (value.includes("/") || value.includes("\\")) return await pathExists(value) ? value : void 0;
  try {
    if (process.platform === "win32") {
      const probe = `$c = Get-Command -Name ${powershellLiteral(value)} -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1; if ($c) { $c.Source }`;
      const result2 = await runNativeCommand2("powershell.exe", ["-NoProfile", "-Command", probe], signal);
      const found2 = (result2.stdout ?? "").trim();
      return found2 === "" ? void 0 : found2;
    }
    const result = await runNativeCommand2("which", [value], signal);
    const found = (result.stdout ?? "").trim().split(/\r?\n/)[0];
    return found === "" ? void 0 : found;
  } catch {
    return void 0;
  }
}
async function resolveSlotOpener(slot, state, config, signal) {
  const entry = state.apps[slot];
  if (entry !== void 0 && entry.enabled && entry.command.trim() !== "") {
    return { command: entry.command, label: entry.label };
  }
  if (state.status === "off") return void 0;
  const seed = configuredSeed(config);
  const order = slot === "markdown" ? ["typora", "marktext"] : slot === "code" ? ["vscode"] : [];
  for (const id of order) {
    const value = seed[id];
    if (value === void 0 || value === "") continue;
    const command = await resolveConfiguredValue(value, signal);
    if (command !== void 0) return { command, label: CANDIDATE_LABELS[id] ?? id };
  }
  return void 0;
}
function noOpenerMessage(slot) {
  const what = slot === "markdown" ? "Markdown \u7F16\u8F91\u5668" : slot === "code" ? "\u4EE3\u7801\u7F16\u8F91\u5668" : "\u6587\u6863\u5E94\u7528";
  return `\u6CA1\u6709\u914D\u7F6E\u53EF\u7528\u7684${what}\uFF1A\u8BF7\u5728\u672C\u63D2\u4EF6\u4FA7\u680F\u7684\u300C\u6253\u5F00\u65B9\u5F0F\u8BBE\u7F6E\u300D\u91CC\u9009\u62E9\u6216\u586B\u5199\u5BF9\u5E94\u8F6F\u4EF6\u7684\u542F\u52A8\u8DEF\u5F84`;
}
var name = "workspace-files";
var inject = ["connection", "webServer"];
function parsePath(payload) {
  if (typeof payload !== "object" || payload === null) return void 0;
  const path = payload.path;
  return typeof path === "string" && path.length > 0 ? path : void 0;
}
function parseStringField(payload, key) {
  if (typeof payload !== "object" || payload === null) return void 0;
  const value = payload[key];
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
async function listDirectory(path) {
  const dirents = await readdir(path, { withFileTypes: true });
  const rows = [];
  for (const dirent of dirents) {
    if (!dirent.isDirectory() && !dirent.isFile()) continue;
    rows.push({
      name: dirent.name,
      path: join2(path, dirent.name),
      kind: dirent.isDirectory() ? "dir" : "file",
      hidden: dirent.name.startsWith(".")
    });
  }
  rows.sort((a, b) => a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "dir" ? -1 : 1);
  return { path, entries: rows };
}
function powershellLiteral(value) {
  return `'${value.replace(/'/g, "''")}'`;
}
var NOT_FOUND_RE = /not (recognized|found)|CommandNotFound|无法将.+识别为|不是内部或外部命令/;
async function runOpener(command, path, signal) {
  try {
    if (process.platform === "win32") {
      await runNativeCommand2(
        "powershell.exe",
        ["-NoProfile", "-Command", `& ${powershellLiteral(command)} ${powershellLiteral(path)}`],
        signal
      );
    } else {
      await runNativeCommand2(command, [path], signal);
    }
  } catch (error) {
    if (signal.aborted) throw error;
    const message = error instanceof Error ? error.message : String(error);
    if (error?.code === "ENOENT" || NOT_FOUND_RE.test(message)) {
      throw new Error(
        `\u627E\u4E0D\u5230\u53EF\u6267\u884C\u7A0B\u5E8F "${command}"\uFF1A\u8BF7\u786E\u8BA4\u5DF2\u5B89\u88C5\u5E76\u52A0\u5165 PATH\uFF0C\u6216\u5728\u63D2\u4EF6\u914D\u7F6E\uFF08cordis.patch.yml \u7684 workspace-files \u884C\uFF09\u4E2D\u586B\u5199\u5B8C\u6574\u8DEF\u5F84`
      );
    }
    throw error instanceof Error ? error : new Error(message);
  }
}
async function openWithDefaultApp(path, signal) {
  if (process.platform === "win32") {
    await runNativeCommand2(
      "powershell.exe",
      ["-NoProfile", "-Command", `Start-Process -FilePath ${powershellLiteral(path)}`],
      signal
    );
    return;
  }
  await runNativeCommand2(process.platform === "darwin" ? "open" : "xdg-open", [path], signal);
}
var ROUTE_PATH = "/workspace-files";
var MAX_BODY_BYTES = 64 * 1024;
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
          settle(response, 405, { ok: false, message: "workspace-files: this route accepts POST only" });
          return;
        }
        const endpoint = new URL(request.url ?? "/", "http://127.0.0.1").pathname.slice(ROUTE_PATH.length + 1);
        let payload;
        try {
          payload = await readJsonBody(request);
        } catch (error) {
          settle(response, 400, {
            ok: false,
            message: `workspace-files: malformed request body: ${error instanceof Error ? error.message : String(error)}`
          });
          return;
        }
        const controller = new AbortController();
        response.once("close", () => {
          if (!response.writableEnded) controller.abort();
        });
        const signal = controller.signal;
        if (endpoint === "list") {
          const path = parseStringField(payload, "path");
          if (path === void 0) {
            settle(response, 400, { ok: false, message: "workspace-files: list requires a non-empty string path" });
            return;
          }
          try {
            settle(response, 200, { ok: true, value: await listDirectory(path) });
          } catch (error) {
            settle(response, 500, {
              ok: false,
              message: `workspace-files: \u65E0\u6CD5\u8BFB\u53D6\u76EE\u5F55 ${path}: ${error instanceof Error ? error.message : String(error)}`
            });
          }
          return;
        }
        if (endpoint === "state") {
          try {
            settle(response, 200, { ok: true, value: await loadState() });
          } catch (error) {
            settle(response, 500, { ok: false, message: error instanceof Error ? error.message : String(error) });
          }
          return;
        }
        if (endpoint === "scan") {
          const deep = typeof payload?.deep === "boolean" && payload.deep === true;
          try {
            const result = await scanApps({ configured: configuredSeed(config), deep, signal });
            settle(response, 200, { ok: true, value: result });
          } catch (error) {
            if (signal.aborted) {
              settle(response, 499, { ok: false, message: "workspace-files: the request was aborted" });
              return;
            }
            settle(response, 500, { ok: false, message: error instanceof Error ? error.message : String(error) });
          }
          return;
        }
        if (endpoint === "save") {
          const saved = parseState(payload);
          if (saved === void 0) {
            settle(response, 400, { ok: false, message: "workspace-files: save requires a status and an apps map" });
            return;
          }
          try {
            await saveState(saved);
            settle(response, 200, { ok: true, value: saved });
          } catch (error) {
            settle(response, 500, { ok: false, message: error instanceof Error ? error.message : String(error) });
          }
          return;
        }
        if (endpoint === "open-default" || endpoint === "open-in-code" || endpoint === "open-in-markdown" || endpoint === "open-in-office") {
          const path = parsePath(payload);
          if (path === void 0) {
            settle(response, 400, { ok: false, message: `workspace-files: ${endpoint} requires a non-empty string path` });
            return;
          }
          try {
            if (endpoint === "open-default") {
              await openWithDefaultApp(path, signal);
            } else {
              const slot = endpoint === "open-in-code" ? "code" : endpoint === "open-in-markdown" ? "markdown" : "office";
              const state = await loadState();
              const opener = await resolveSlotOpener(slot, state, config, signal);
              if (opener === void 0) throw new Error(noOpenerMessage(slot));
              await runOpener(opener.command, path, signal);
            }
            settle(response, 200, { ok: true, value: { opened: true } });
          } catch (error) {
            if (signal.aborted) {
              settle(response, 499, { ok: false, message: "workspace-files: the request was aborted" });
              return;
            }
            settle(response, 500, { ok: false, message: error instanceof Error ? error.message : String(error) });
          }
          return;
        }
        settle(response, 404, { ok: false, message: `workspace-files: unknown endpoint ${endpoint}` });
      }
    };
    webCtx.effect(() => webCtx.webServer.register(route), "workspace-files: route");
  });
}
export {
  Config,
  apply,
  inject,
  name
};
