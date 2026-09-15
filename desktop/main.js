'use strict';
// DeepSeek Harness 桌面外壳(Electron 主进程)
//
// 职责:
//   1. 无窗口(PowerShell/控制台)地拉起与守护 dsh web 服务
//   2. 提供自定义标题栏窗口:[刷新/重启 Harness] [最小化] [最大化] [关闭]
//   3. 标题栏配色跟随 Harness 主题

const { app, BaseWindow, WebContentsView, ipcMain, nativeTheme, screen, shell } = require('electron');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');

app.setName('DeepSeek Harness');
app.setAppUserModelId('DeepSeek.Harness');

const ROOT = path.resolve(__dirname, '..');
const PORT = 3080;
const APP_URL = `http://127.0.0.1:${PORT}`;
const TITLEBAR_HEIGHT = 38;

const DSH_BIN = path.join(ROOT, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js');
const LOG_FILE = path.join(ROOT, 'server.log');
const ERR_FILE = path.join(ROOT, 'server.log.err');
const ICON_ICO = path.join(__dirname, 'assets', 'harness.ico');
const ICON_PNG = path.join(__dirname, 'assets', 'harness-256.png');
const PRELOAD = path.join(__dirname, 'preload.js');
const SHELL_HTML = path.join(__dirname, 'shell.html');
const LOADING_HTML = path.join(__dirname, 'loading.html');
const STATE_FILE = path.join(app.getPath('userData'), 'window-state.json');

// 启动追踪:外壳没有控制台,GUI 启动异常时靠这条日志定位(与 server.log 同目录)
const BOOT_TRACE = path.join(ROOT, 'desktop-boot.log');
function trace(message) {
  try {
    fs.appendFileSync(BOOT_TRACE, `${new Date().toISOString()} ${message}\n`);
  } catch { /* ignore */ }
}
trace('main.js loaded');

// 系统代理(与 launch-server.ps1 保持一致),按需修改
const DEFAULT_PROXY = 'http://127.0.0.1:7897';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let shellWin = null;        // BaseWindow:只承载视图,自身没有 webContents
let titlebarView = null;    // 顶部自定义标题栏(刷新/最小化/最大化/关闭)
let appView = null;         // Harness 页面本体
let serverChild = null;
let restarting = false;
let lastState = 'starting';

/* ------------------------------------------------------------------ *
 * 工具:进程 / 端口
 * ------------------------------------------------------------------ */

function findNodeExe() {
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    const candidate = path.join(dir, 'node.exe');
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/** 测试端口是否可连接(服务就绪判定) */
function canConnect(port, timeout = 1000) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    const settle = (ok) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => settle(true));
    socket.once('timeout', () => settle(false));
    socket.once('error', () => settle(false));
  });
}

/** 查询监听指定端口的进程 PID(可能多个) */
function listenerPids(port) {
  const pids = new Set();
  try {
    const out = execSync('netstat -ano -p TCP', {
      windowsHide: true,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    });
    for (const line of out.split(/\r?\n/)) {
      if (!/LISTENING/i.test(line)) continue;
      const match = line.match(/:(\d+)\s+\S+\s+LISTENING\s+(\d+)/i);
      if (match && Number(match[1]) === port) pids.add(Number(match[2]));
    }
  } catch { /* ignore */ }
  return [...pids];
}

/* ------------------------------------------------------------------ *
 * 服务生命周期
 * ------------------------------------------------------------------ */

function startServer() {
  const nodeExe = findNodeExe();
  if (!nodeExe) throw new Error('未找到 node.exe,请确认 Node.js 已加入 PATH');
  if (!fs.existsSync(DSH_BIN)) throw new Error(`未找到 dsh 入口: ${DSH_BIN}`);

  const env = { ...process.env };
  if (!env.HTTP_PROXY && !env.http_proxy) env.HTTP_PROXY = DEFAULT_PROXY;
  if (!env.HTTPS_PROXY && !env.https_proxy) env.HTTPS_PROXY = DEFAULT_PROXY;

  const out = fs.openSync(LOG_FILE, 'a');
  const err = fs.openSync(ERR_FILE, 'a');

  serverChild = spawn(nodeExe, [DSH_BIN, 'web', '--no-open'], {
    cwd: ROOT,
    detached: true,      // 应用退出后服务继续运行
    windowsHide: true,   // 关键:不弹出控制台窗口
    stdio: ['ignore', out, err],
    env,
  });
  serverChild.unref();
  return serverChild;
}

async function stopServer() {
  if (serverChild && serverChild.exitCode === null && !serverChild.killed) {
    try { serverChild.kill(); } catch { /* ignore */ }
  }
  serverChild = null;

  for (const pid of listenerPids(PORT)) {
    try {
      execSync(`taskkill /PID ${pid} /T /F`, { windowsHide: true, stdio: 'ignore' });
    } catch { /* ignore */ }
  }

  // 等待端口释放
  for (let i = 0; i < 40; i++) {
    if (!(await canConnect(PORT, 400))) return;
    await delay(150);
  }
}

/** 等待服务就绪(每 400ms 探测一次) */
async function waitForServer(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await canConnect(PORT)) return true;
    await delay(400);
  }
  return false;
}

/**
 * 等待服务能应答 HTTP(不只端口可连)。dsh 启动时先 listen 端口,
 * 片刻之后才打印 token 并完成路由/鉴权链的装配;这一窗口期内发出的
 * 请求可能悬而不答,页签就会停在空白页上。逐次探测到白名单外的
 * 任何 HTTP 响应码(包括 401)才算真正就绪。
 * @param {number} [timeoutMs] 总超时。
 * @returns {Promise<boolean>} 是否收到了 HTTP 响应。
 */
async function waitForHttpReady(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if ((await httpProbe(3000)) > 0) return true;
    await delay(250);
  }
  return false;
}

/** 对根地址发一次 GET;返回响应码(0 = 未响应/出错/超时)。 */
function httpProbe(timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (status) => {
      if (settled) return;
      settled = true;
      resolve(status);
    };
    try {
      const request = http.get(`${APP_URL}/`, { timeout: timeoutMs }, (response) => {
        response.resume();
        finish(response.statusCode ?? 0);
      });
      request.on('timeout', () => { request.destroy(); finish(0); });
      request.on('error', () => finish(0));
    } catch {
      finish(0);
    }
  });
}

/* ------------------------------------------------------------------ *
 * 启动凭据(token)时序
 * ------------------------------------------------------------------ */

/** 当前日志文件的字节数(下次启动新加的 token 从这里之后出现)。 */
function launchLogOffset() {
  try { return fs.statSync(LOG_FILE).size; } catch { return 0; }
}

/**
 * 读取日志 offset 之后第一个 `token=` 值。dsh 每次启动会追加一行
 * `dsh web: http://127.0.0.1:3080/?token=...`;重启后端口先可连、
 * token 后落盘(实测相差约 0.5s),所以必须按偏移量只认新追加的那行。
 * @param {number} offset - 启动前记录的日志字节数。
 * @returns {string|null} 新 token,尚未写入时为 null。
 */
function readTokenAfter(offset) {
  try {
    const fd = fs.openSync(LOG_FILE, 'r');
    try {
      const size = fs.fstatSync(fd).size;
      if (size <= offset) return null;
      const length = size - offset;
      const buffer = Buffer.alloc(length);
      fs.readSync(fd, buffer, 0, length, offset);
      const match = buffer.toString('utf8').match(/[?&]token=([A-Za-z0-9_-]+)/);
      return match ? match[1] : null;
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return null;
  }
}

/**
 * 等待重启后的新 token 出现(每 200ms 查一次)。
 * @param {number} offset - 启动前记录的日志字节数。
 * @param {number} [timeoutMs] 总超时;超时返回 null(调用方继续尽力加载)。
 * @returns {Promise<string|null>} 新 token。
 */
async function waitForNewToken(offset, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const token = readTokenAfter(offset);
    if (token !== null) return token;
    await delay(200);
  }
  return null;
}

/** 确保服务在运行;返回本次是否启动了服务 */
async function ensureServer() {
  if (await canConnect(PORT)) return false;
  startServer();
  if (!(await waitForServer())) {
    throw new Error('服务启动超时,请查看 server.log');
  }
  return true;
}

/* ------------------------------------------------------------------ *
 * 窗口 / 视图
 * ------------------------------------------------------------------ */

function loadWindowState() {
  try {
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (typeof raw.width === 'number' && typeof raw.height === 'number') return raw;
  } catch { /* ignore */ }
  return null;
}

function saveWindowState() {
  if (!shellWin || shellWin.isDestroyed()) return;
  try {
    const bounds = shellWin.getNormalBounds();
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify({ ...bounds, maximized: shellWin.isMaximized() }), 'utf8');
  } catch { /* ignore */ }
}

function sanitizeBounds(state) {
  if (!state) return null;
  const area = screen.getAllDisplays().some((display) => {
    const w = display.workArea;
    return state.x < w.x + w.width && state.x + state.width > w.x
      && state.y < w.y + w.height && state.y + state.height > w.y;
  });
  return area ? state : null;
}

function layoutViews() {
  if (!shellWin || shellWin.isDestroyed()) return;
  const [width, height] = shellWin.getContentSize();
  if (titlebarView && !titlebarView.webContents.isDestroyed()) {
    titlebarView.setBounds({ x: 0, y: 0, width: Math.max(0, width), height: TITLEBAR_HEIGHT });
  }
  if (appView && !appView.webContents.isDestroyed()) {
    appView.setBounds({
      x: 0,
      y: TITLEBAR_HEIGHT,
      width: Math.max(0, width),
      height: Math.max(0, height - TITLEBAR_HEIGHT),
    });
  }
}

function sendToShell(channel, payload) {
  if (titlebarView && !titlebarView.webContents.isDestroyed()) {
    titlebarView.webContents.send(channel, payload);
  }
}

function setState(state, message) {
  lastState = state;
  sendToShell('shell:state', { state, message: message || null, restarting });
}

/**
 * 从服务日志里读出本次启动的一次性 token。
 * dsh 0.1.5 起 Web 界面需要浏览器会话鉴权:进程启动时打印
 * `dsh web: http://127.0.0.1:3080/?token=<token>`,首次访问必须带上它
 * (服务端校验后换成 Cookie,之后的访问不再需要)。
 * @returns {string|null} token 或 null(尚未打印)
 */
function readLaunchToken() {
  try {
    const text = fs.readFileSync(LOG_FILE, 'utf8');
    const matches = text.match(/[?&]token=([A-Za-z0-9_-]+)/g);
    if (!matches || matches.length === 0) return null;
    return matches[matches.length - 1].replace(/^[?&]token=/, '');
  } catch {
    return null;
  }
}

/** 在内容视图中显示占位页(启动中/重启中/出错) */
function showLoading(message) {
  if (!appView || appView.webContents.isDestroyed()) return;
  appView.webContents.loadFile(LOADING_HTML, { query: { msg: message || '正在启动 Harness…' } });
}

/**
 * 页面是否已经可用:既不是「需要鉴权」提示页,也不是空白文档。
 * dsh 服务在启动窗口期可能让导航停在空白页(URL 已更新、body 为空),
 * 只有内容真的渲染出来才算加载成功。
 * @param {number} [timeoutMs] 等待渲染的最长时间(React 首帧可能稍晚)。
 * @returns {Promise<boolean>} 页面是否可用。
 */
async function pageUsable(timeoutMs = 2500) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    try {
      last = await appView.webContents.executeJavaScript(`(() => {
        const body = document.body;
        const text = body ? body.innerText : '';
        return {
          childCount: body ? body.childElementCount : -1,
          textLen: text.trim().length,
          needsAuth: text.includes('authentication required'),
        };
      })()`);
      if (last && last.needsAuth !== true && (last.childCount > 0 || last.textLen > 0)) return true;
    } catch { /* 页面切换瞬间执行 JS 可能失败,下一轮再试 */ }
    await delay(250);
  }
  trace(`pageUsable: 未出现可用页面(最后一次探测 ${JSON.stringify(last)})`);
  return false;
}

/**
 * 加载 Harness 页面:每次尝试都重新读取日志里的最新 token(带 token 打开
 * 一次,服务端换发 Cookie 并跳转到干净地址),并等待页面真正可用。
 * 用旧 token 打开会拿到 401 提示页或空白页;重启刚完成时新 token 可能
 * 还没落盘,所以「重试 + 重新读 token」是这里的关键——重试间隔后新 token
 * 往往已写入,第二次就能换成 Cookie 进入应用。
 * @param {{ attempts?: number }} [options]
 * @returns {Promise<boolean>} 页面是否加载成功。
 */
async function loadApp({ attempts = 3 } = {}) {
  if (!appView || appView.webContents.isDestroyed()) return false;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const token = readLaunchToken();
    const url = token === null ? APP_URL : `${APP_URL}/?token=${token}`;
    trace(`loadApp#${attempt}: ${url.replace(/token=[^&]+/, 'token=<hidden>')}`);
    let timer;
    try {
      await Promise.race([
        appView.webContents.loadURL(url),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('导航超时')), 10_000);
        }),
      ]);
    } catch (error) {
      if (timer) clearTimeout(timer);
      trace(`loadApp#${attempt}: 导航失败 ${error && error.message}`);
      await delay(400);
      continue;
    }
    if (timer) clearTimeout(timer);
    if (await pageUsable()) return true;
  }
  return false;
}

/** 读取 Harness 页面主题并同步给标题栏 */
async function syncTheme() {
  if (!appView || appView.webContents.isDestroyed()) return;
  if (!appView.webContents.getURL().startsWith(APP_URL)) return;
  try {
    const info = await appView.webContents.executeJavaScript(`(() => {
      const parse = (value) => {
        const m = /rgba?\\(([^)]+)\\)/.exec(value || '');
        if (!m) return null;
        const parts = m[1].split(',').map((s) => parseFloat(s));
        if (parts.length < 3) return null;
        const alpha = parts.length > 3 ? parts[3] : 1;
        return { rgb: [parts[0], parts[1], parts[2]], alpha };
      };
      let bg = parse(getComputedStyle(document.body).backgroundColor);
      if (!bg || bg.alpha === 0) bg = parse(getComputedStyle(document.documentElement).backgroundColor);
      const fg = parse(getComputedStyle(document.body).color);
      return {
        bg: bg && bg.alpha > 0 ? bg.rgb : null,
        fg: fg && fg.alpha > 0 ? fg.rgb : null,
        dark: matchMedia('(prefers-color-scheme: dark)').matches,
      };
    })()`);
    sendToShell('shell:theme', info);
  } catch { /* ignore */ }
}

function createWindow() {
  const saved = sanitizeBounds(loadWindowState());
  const dark = nativeTheme.shouldUseDarkColors;

  // 无边框 BaseWindow:内部由两个视图组成(标题栏 + Harness 页面)
  // 用 BrowserWindow 会带一个隐式页面层,把子视图挡住,故改用 BaseWindow
  shellWin = new BaseWindow({
    width: saved ? saved.width : 1360,
    height: saved ? saved.height : 880,
    x: saved ? saved.x : undefined,
    y: saved ? saved.y : undefined,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    show: false,
    backgroundColor: dark ? '#1f1f1f' : '#f7f8fa',
    icon: ICON_ICO,
    title: 'DeepSeek Harness',
  });

  // 视图 1:自定义标题栏
  titlebarView = new WebContentsView({
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  shellWin.contentView.addChildView(titlebarView);
  titlebarView.webContents.loadFile(SHELL_HTML);
  titlebarView.webContents.once('did-finish-load', () => {
    if (!shellWin || shellWin.isDestroyed()) return;
    shellWin.show();
    if (shellWin.isMinimized()) shellWin.restore();
    // 延迟一帧再最大化:无边框窗口在 show() 同一帧内 maximize() 可能被系统压成最小化
    if (saved && saved.maximized) {
      setTimeout(() => {
        if (shellWin && !shellWin.isDestroyed()) shellWin.maximize();
      }, 150);
    }
    sendToShell('shell:window-state', { maximized: Boolean(saved && saved.maximized) });
  });

  // 视图 2:Harness 页面本体
  appView = new WebContentsView({
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
  });
  shellWin.contentView.addChildView(appView);
  layoutViews();

  appView.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);   // 外链交给系统浏览器
    return { action: 'deny' };
  });
  appView.webContents.on('did-finish-load', () => {
    if (appView.webContents.getURL().startsWith(APP_URL)) syncTheme();
  });
  appView.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) return;   // ERR_ABORTED:导航被更新的加载取代(重启/重试的正常现象)
    if (!validatedURL.startsWith(APP_URL)) return;   // 占位页自身失败时忽略
    showLoading(`无法连接 Harness 服务(${errorDescription})\n\n点击标题栏的刷新按钮可重试。`);
    setState('error', errorDescription);
  });

  // 应用内快捷键:F5 刷新页面,Ctrl+Shift+R 重启 Harness
  appView.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r' && !input.shift)) {
      void refreshApp();
      event.preventDefault();
    } else if (input.control && input.shift && input.key.toLowerCase() === 'r') {
      restartHarness();
      event.preventDefault();
    }
  });

  shellWin.on('resize', layoutViews);
  shellWin.on('maximize', () => { layoutViews(); sendToShell('shell:window-state', { maximized: true }); });
  shellWin.on('unmaximize', () => { layoutViews(); sendToShell('shell:window-state', { maximized: false }); });
  shellWin.on('enter-full-screen', () => { layoutViews(); sendToShell('shell:window-state', { maximized: true }); });
  shellWin.on('leave-full-screen', () => { layoutViews(); sendToShell('shell:window-state', { maximized: false }); });
  shellWin.on('focus', syncTheme);
  shellWin.on('close', saveWindowState);
  shellWin.on('closed', () => { shellWin = null; titlebarView = null; appView = null; });
}

/* ------------------------------------------------------------------ *
 * 启动 / 重启
 * ------------------------------------------------------------------ */

async function boot() {
  createWindow();
  showLoading('正在启动 Harness…');
  setState('starting', '正在启动 Harness…');
  const offset = launchLogOffset();
  try {
    const started = await ensureServer();
    if (!(await waitForHttpReady())) throw new Error('服务启动超时,请查看 server.log');
    if (started) await waitForNewToken(offset, 30_000);
    if (!(await loadApp())) throw new Error('页面加载失败,请点击标题栏的刷新按钮重试');
    setState('ready');
  } catch (err) {
    showLoading(`${err.message}\n\n点击标题栏的刷新按钮可重试。`);
    setState('error', err.message);
  }
}

async function restartHarness() {
  if (restarting) return;
  restarting = true;
  setState('restarting', '正在重启 Harness…');
  showLoading('正在重启 Harness…');
  const offset = launchLogOffset();
  try {
    await stopServer();
    startServer();
    if (!(await waitForHttpReady())) throw new Error('服务重启超时,请查看 server.log');
    const token = await waitForNewToken(offset, 30_000);
    trace(`restart: 新 token ${token === null ? '未出现(继续尽力加载)' : '已就绪'}`);
    if (!(await loadApp())) throw new Error('页面加载失败,请点击标题栏的刷新按钮重试');
    restarting = false;
    setState('ready');
  } catch (err) {
    restarting = false;
    showLoading(`重启失败:${err.message}\n\n点击标题栏的刷新按钮可重试。`);
    setState('error', err.message);
  }
}

/** 刷新页面(不重启服务):重走一遍加载,页面不可用时自动换 token 重试。 */
async function refreshApp() {
  trace('refresh: reload app view');
  if (await loadApp()) {
    setState('ready');
    return;
  }
  showLoading('无法连接 Harness 服务\n\n点击标题栏的刷新按钮可重试。');
  setState('error', '刷新失败');
}

/* ------------------------------------------------------------------ *
 * IPC
 * ------------------------------------------------------------------ */

ipcMain.on('shell:minimize', () => shellWin && shellWin.minimize());
ipcMain.on('shell:toggle-maximize', () => {
  if (!shellWin) return;
  if (shellWin.isMaximized()) shellWin.unmaximize();
  else shellWin.maximize();
});
ipcMain.on('shell:close', () => shellWin && shellWin.close());
ipcMain.on('shell:reload-app', () => { void refreshApp(); });
ipcMain.on('shell:restart-harness', () => { restartHarness(); });
ipcMain.handle('shell:get-state', () => ({
  state: lastState,
  restarting,
  maximized: shellWin ? shellWin.isMaximized() : false,
  icon: ICON_PNG,
}));

/* ------------------------------------------------------------------ *
 * 应用入口
 * ------------------------------------------------------------------ */

if (!app.requestSingleInstanceLock()) {
  trace('single-instance lock unavailable: quitting');
  app.quit();
} else {
  trace('single-instance lock acquired');
  app.on('second-instance', () => {
    if (shellWin) {
      if (shellWin.isMinimized()) shellWin.restore();
      shellWin.focus();
    }
  });

  app.whenReady().then(() => {
    trace('app ready: booting');
    boot();
  });
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', saveWindowState);
}
