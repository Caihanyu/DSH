# DeepSeek Harness 个人插件与配置 (DSH)

本仓库备份并分享我在 **DeepSeek Harness** (deepseek-ai/deepseek-harness) 上自研的
profile 级扩展插件、agent 预设与 Windows 启动脚本。所有插件均为**可选 profile 插件**，
不在官方 `dsh-base` / `dsh-web-app` bundle 中，harness 本体更新不会影响它们。

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
├── config/                         # 运行时配置(需手动放置到 ~/.dsh)
│   ├── settings.yaml               # 全局设置(默认 agent 预设、默认模型等)
│   └── agent-presets/              # agent 预设(复制到 ~/.dsh/.agent-presets/)
│       ├── dsh-anchored-subagent/  # Minimal → 完整工具目录的锚定开局
│       └── minimal-win/            # Windows 双工具编码 Agent(pwsh + str_replace_editor)
└── scripts/                        # 本机启动脚本(放在 DSH 仓库根目录使用)
    ├── deploy-plugin.ps1           # 构建 + 部署插件到 ~/.dsh/profiles/web
    ├── launch-server.ps1           # 无窗口后台启动 dsh web(开机自启用)
    └── launch-desktop.ps1          # 桌面快捷方式:拉起服务 + Edge 独立窗口
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

## config/ — 运行时配置

放在 `~/.dsh/` 下(Windows 为 `C:\Users\<你>\.dsh`):

- `settings.yaml` → `~/.dsh/settings.yaml` — 默认 agent 预设、默认模型等全局设置。
- `agent-presets/<name>/` → `~/.dsh/.agent-presets/<name>/` — agent 预设目录,
  在 `settings.yaml` 的 `agent-presets.default` 中引用。
  注意 `dsh-anchored-subagent` 插件会把它自带的预设安装/覆盖到该目录,
  覆盖后需重做 Windows 适配(pwsh 替换 bash)。

> 本仓库**不含**任何敏感数据:`~/.dsh/.credentials.yaml`(API 密钥)、
> `~/.dsh/sessions/`(会话记录)、`~/.dsh/storages/`、`~/.dsh/ssh-files/state.json`
> (服务器记录,可能含口令)均**不会**出现在这里,请勿提交。

## scripts/ — 启动脚本(Windows)

放在 DSH 主仓库根目录使用。脚本内写死本机代理 `127.0.0.1:7890`(Clash),
按需修改。文件需保持 **UTF-8 with BOM**(PowerShell 5.1 无 BOM 会按 GBK 解析导致乱码)。

- `launch-server.ps1` — 无窗口后台启动 `dsh web`(端口 3080),日志写 `server.log`。
- `launch-desktop.ps1` — 若服务未运行先拉起,再以 Edge `--app` 独立窗口打开界面;
  可创建桌面快捷方式指向它。

## 说明

- 插件源码最初在 DSH 主仓库 `packages/extensions/` 下开发(未跟踪状态),
  本仓库为独立备份/分享副本。
- 若使用 junction 安装插件,注意 `lib/` 需与主仓库中的 peer 依赖(如
  `@deepseek-ai/dsh-client-runtime`)版本匹配;升级 harness 后建议重新构建。
