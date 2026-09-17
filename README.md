# DeepSeek Harness 个人插件与配置 (DSH)

本仓库备份并分享我在 **DeepSeek Harness** (deepseek-ai/deepseek-harness) 上自研的
profile 级扩展插件、agent 预设、**桌面外壳(Electron)** 与 Windows 启动脚本。
所有插件均为**可选 profile 插件**，不在官方 `dsh-base` / `dsh-web-app` bundle 中，
harness 本体更新不会影响它们。

> **兼容性：本仓库插件适配 DeepSeek Harness 0.1.6**（在 `0.1.6-alpha.1` 上实测运行）。
> 两个插件都已从 0.1.5 的 `details` 槽位写法迁移到 0.1.6 的**右侧边栏页签**（`sidebarRightTabs`）。
> 另：官方 0.1.6 新增的 SSH 家族包（`dsh-ssh` / `dsh-fs-ssh` / `dsh-subprocess-ssh` / `dsh-sandbox-ssh`）
> 是“远端工作区”后端（仅支持 Linux/macOS 端点、无 Web 界面、需远端预装 helper），不替代本仓库的 `dsh-ssh-files`。

## 目录结构

```
DSH/
├── plugins/                        # 自研 profile 级插件(源码 + lib 构建产物)
│   ├── dsh-ssh-files/              # SSH 远程文件面板 + 模型 ssh_* 工具
│   └── dsh-workspace-files/        # 工作区文件浏览器(双击用配置的软件打开 + 首次运行向导)
├── build/                          # 独立客户端构建器(不依赖 harness monorepo)
│   └── client-bundle.mjs           # esbuild + lightningcss，产出宿主端 ESM + 浏览器端 bundle
├── desktop/                        # 桌面外壳(Electron 独立 npm 项目)
│   ├── main.js                     # 主进程:窗口/视图、服务启停守护、IPC
│   ├── shell.html / shell.js       # 自定义标题栏(刷新/重启/最小化/最大化/关闭)
│   ├── preload.js                  # 标题栏 IPC 桥接(contextBridge)
│   ├── loading.html                # 启动/重启占位页
│   └── assets/                     # 应用图标(harness.ico 等)与生成脚本
├── config/                         # 运行时配置(需手动放置到 ~/.dsh)
│   ├── settings.yaml               # 全局设置(默认 agent 预设、默认模型等)
│   └── agent-presets/              # agent 预设(复制到 ~/.dsh/.agent-presets/)
│       ├── dsh-anchored-subagent/  # Minimal → 完整工具目录的锚定开局
│       └── minimal-win/            # Windows 双工具编码 Agent(pwsh + str_replace_editor)
└── scripts/                        # 本机启动脚本(复制到 DSH 安装目录使用)
    ├── deploy-plugin.ps1           # 构建 + 部署插件到 ~/.dsh/profiles/web
    ├── launch-server.ps1           # 无窗口后台启动 dsh web(开机自启用)
    └── launch-desktop.ps1          # 桌面快捷方式:优先 Electron 外壳,回退 Edge 窗口
```

## plugins/ — 自研插件

两个插件均含 `src/` 源码与 `lib/` 构建产物(宿主端 ESM + 浏览器端 bundle),
不含 `node_modules`(运行时依赖由 web profile 安装)。详细功能见各插件 README:

- [dsh-ssh-files](plugins/dsh-ssh-files/README.md) — SSH 远程文件访问:
  右侧边栏「SSH 文件」Tab、多服务器管理、SFTP 读写(本地浏览交给内置工作区树,面板已不收本地模式),
  以及模型可用的 `ssh_status/ssh_connect/ssh_list/ssh_read/ssh_write/ssh_mkdir/
  ssh_rm/ssh_exec` 工具。会话隔离、自动回连。
- [dsh-workspace-files](plugins/dsh-workspace-files/README.md) — 工作区文件浏览器（**适配 harness 0.1.6**）：
  **接管内置的「工作区文件」Tab**（扩展注册覆盖内置 `files` 类型，只留一个入口），
  **双击**按类型用 Typora / MarkText / WPS Office / VS Code / 默认应用打开，
  行尾「⋯」是与左侧同款的贴按钮菜单（含在侧栏预览），
  首次运行有设置向导（自动查找或手填软件路径；全部留空则**不改动** Harness 的文件打开行为）。

### 构建(不依赖 harness monorepo)

harness 0.1.5 起客户端插件必须是预编译产物(宿主端 `lib/index.js` + 浏览器端
`lib/client.js`),而官方 `clientBundle` 预设只存在于 harness 仓库内。本仓库自带
等价的独立构建器 `build/client-bundle.mjs`(esbuild + lightningcss):

```powershell
# 插件目录内先装一次依赖(类型包 + esbuild/lightningcss)
cd plugins\dsh-ssh-files
npm install --legacy-peer-deps
npm approve-scripts esbuild@0.28.2   # npm 11 默认拦截安装脚本
npm rebuild esbuild

# 构建(宿主端打包本地模块;客户端产出 __ModuleLoader__ 工厂)
node E:\DSH\build\client-bundle.mjs E:\DSH\plugins\dsh-ssh-files
```

宿主端必须 `bundle: true` + `packages: 'external'`,否则 `lib/index.js` 里会残留
`./store.ts` 之类的导入,装进 profile 后直接 `ERR_MODULE_NOT_FOUND`。

### 安装到 web profile 并部署改动

profile 里装的是**拷贝**而非软链,所以改完代码要重新同步一次:

```powershell
# 首次安装(路径含空格时用 file: 形式;需要 pnpm,可 corepack enable 获取)
dsh plugin --profile web add "file:E:/DSH/plugins/dsh-ssh-files"

# 之后每次改动的构建 + 部署一步到位
powershell -File E:\DSH\scripts\deploy-plugin.ps1 dsh-ssh-files
```

`deploy-plugin.ps1` 会调用构建器,再把 `lib/`、`cordis.patch.yml`、`package.json`
拷进 `~/.dsh/profiles/web/node_modules/@deepseek-ai/<插件名>`;之后重启 dsh web 即可。

## desktop/ — 桌面外壳(Electron)

把 `dsh web` 的 Web 界面包装成独立桌面应用:自定义标题栏(⟳ 重启 / 最小化 / 最大化 / 关闭)、
**全程无 PowerShell 控制台窗口**、服务启停由外壳内部守护;标题栏配色跟随 Harness 页面主题。

```
BaseWindow(无边框)
├── 标题栏视图  shell.html + preload.js   (自定义按钮)
└── 内容视图    http://127.0.0.1:3080     (Harness 界面)
```

- 安装(该目录是独立 npm 项目;npm 11 需允许 electron 安装脚本,见其 `package.json` 的 `allowScripts`):
  ```powershell
  cd desktop
  npm install
  ```
- 启动:双击 `desktop\node_modules\electron\dist\electron.exe`(可自建快捷方式,图标
  `desktop\assets\harness.ico`),或在 `desktop` 目录内 `npm start`;也可用 `scripts\launch-desktop.ps1`。
- `F5` / `Ctrl+R` 刷新界面;`Ctrl+Shift+R`(或标题栏 ⟳)重启 Harness 服务。
- 重启/刷新会等新 token 落盘后再加载,并在页面不可用时自动重试,不会停在白屏。
- 图标可用 `npm run icon` 从 `assets/icon-source.svg` 重新生成。
- 更多细节见 [desktop/README.md](desktop/README.md)。

## config/ — 运行时配置

放在 `~/.dsh/` 下(Windows 为 `C:\Users\<你>\.dsh`):

- `settings.yaml` → `~/.dsh/settings.yaml` — 默认 agent 预设、默认模型等全局设置。
- `agent-presets/<name>/` → `~/.dsh/.agent-presets/<name>/` — agent 预设目录,
  在 `settings.yaml` 的 `agent-presets.default` 中引用。
  注意 `dsh-anchored-subagent` 插件会把它自带的预设安装/覆盖到该目录,
  覆盖后需重做 Windows 适配(pwsh 替换 bash)。
  两个预设均已适配 0.1.6:`dsh-persona` 的 `text` 字段更名为必填的 `prefix`;
  `tool-bootstrap.mjs` 用 `snapshotEvents()` 读取会话事件(0.1.2 起
  `session.events` 已不存在)。
- `profile-web/cordis.patch.yml` → `~/.dsh/profiles/web/cordis.patch.yml` —
  web profile 的补丁层,在所有 bundle 层之后应用。当前只覆盖
  `workspace-files-tab` 的打开方式路径(MarkText 不在 PATH),ssh-files
  沿用 bundle 补丁默认上限。

> 本仓库**不含**任何敏感数据:`~/.dsh/.credentials.yaml`(API 密钥)、
> `~/.dsh/sessions/`(会话记录)、`~/.dsh/storages/`、`~/.dsh/ssh-files/state.json`
> (服务器记录,可能含口令)均**不会**出现在这里,请勿提交。

## scripts/ — 启动脚本(Windows)

**复制到你的 DSH 安装目录**(与 `desktop/`、`node_modules/` 同级)后使用;脚本按
`$PSScriptRoot` 定位安装目录。两种安装布局都支持:npm 安装版
(`node_modules/@deepseek-ai/dsh/lib/bin.js`)与源码仓库构建版(`apps/cli/lib/bin.js`)。
代理端口自动探测:`7890` / `7897` 哪个在监听就用哪个,都不在时保持不设置;
也可用 `DSH_PROXY` 环境变量直接指定。文件需保持 **UTF-8 with BOM**
(PowerShell 5.1 无 BOM 会按 GBK 解析导致乱码)。

- `launch-server.ps1` — 无窗口后台启动 `dsh web`(端口 3080),日志写 `server.log`;
  带 60 秒就绪等待与失败日志(适合开机自启)。
- `launch-desktop.ps1` — **优先启动 Electron 桌面外壳**(`desktop/` 内已安装依赖时),
  未安装时回退为 Edge/Chrome `--app` 独立窗口;可创建桌面快捷方式指向它。

## 说明

- 插件源码最初在 DSH 主仓库 `packages/extensions/` 下开发(未跟踪状态),
  本仓库为独立备份/分享副本。0.1.6 起插件改为独立包:宿主端打包成自含的
  `lib/index.js`,浏览器端产出闭包 bundle,运行期只依赖 profile 已装的
  harness 包与平台模块表。
- profile 以 `file:` 方式安装,装的是拷贝;升级 harness 后重跑
  `scripts/deploy-plugin.ps1`(或重新 `dsh plugin --profile web add`)即可。
- profile 安装报 `ERR_PNPM_IGNORED_BUILDS` 时,在
  `~/.dsh/profiles/web/pnpm-workspace.yaml` 写
  `allowBuilds: {cpu-features: false, ssh2: false}`(ssh2 的可选原生绑定,
  纯 JS 回退即可),再重跑安装。
