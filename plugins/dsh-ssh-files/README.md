# dsh-ssh-files

SSH 远程文件访问 —— 一个**可选的 profile 插件**（**适配 harness 0.1.6**：右侧栏「SSH 文件」Tab + `/ssh-files` HTTP 路由），不包含在 harness 的 `dsh-base` / `dsh-web-app` 发布 bundle 里。

在 Web 界面**右侧边栏的「SSH 文件」Tab**（引导页入口）里提供远程文件面板：

- **纯 SSH 形态**：面板只管理远程连接，本地文件浏览交给内置工作区树 / `dsh-workspace-files`；旧会话里记住的 local 模式会在面板挂载时自动切换成 ssh
- **多服务器管理**：记录多台服务器，选择并连接某一台（支持密码 / 私钥文件 / SSH Agent 认证），浏览远程目录树，**面板内直接读写远程文本文件**（新建 / 编辑 / 保存 / 删除 / 建目录）
- **模型可用的 `ssh_*` 工具**：连接后，对话中的模型可以直接调用 `ssh_status` / `ssh_connect` / `ssh_list` / `ssh_read` / `ssh_write` / `ssh_mkdir` / `ssh_rm` / `ssh_exec` 在服务器上干活（读改写文件、跑远程命令）——会话的工具提示会说明这套工具，SSH 会话与其它会话的模型能力互不影响
- **会话隔离**：每个对话**各自记住**服务器，并拥有**各自独立的 SSH 连接**。会话 A 连服务器 X、会话 B 连服务器 Y，两者互不串扰；A 断开不影响 B。全新对话默认继承"最近一次使用"的服务器
- **连接记忆**：记住最近连接的服务器，下次打开自动回连

```
┌───────────────────────────────────────────────┐
│ [服务器▾]                     [连接] [⚙]       │
├───────────────────────────────────────────────┤
│ 目录树（服务器目录，逐层懒加载）                  │
│   · 行内 ⋯ 菜单：新建文件/目录、删除             │
│   · 点击文件 → 内置编辑器：查看、修改、保存       │
└───────────────────────────────────────────────┘
```

## 为什么是插件（与 harness 本体的关系）

| 层面 | 实现 | 与更新的关系 |
|---|---|---|
| **发布 bundle** | 不在 `dsh-base` / `dsh-web-app` 的 `cordis.patch.yml` 中，**没有任何内置 profile 模板引用它** | harness 更新不会自动启用/关闭它 |
| **服务端半部** | 独立 cordis 插件，在应用 HTTP 服务上注册自己的 `/ssh-files` 路由（经 connection 服务的鉴权栅栏），内含 ssh2 连接管理 + SFTP 文件操作 | 通过 profile 的 `cordis.patch.yml` 挂载，与核心并行 |
| **浏览器半部** | `dsh.client` 包，前端 bundle 在运行时动态加载（`/plugins/<id>/client.js`），**不编译进主程序** | 前端 bundle 由 `dsh.client` 扫描器按 package 发现 |
| **安装位置** | `$DSH_HOME/profiles/web/node_modules`（`dsh plugin` 管理） | harness 的 `git pull` / 重新构建不会触碰它 |
| **数据** | 服务器记录存于 `~/.dsh/ssh-files/state.json`（`resolveDshHome` 之下） | 不随仓库更新变动 |

前端通过右侧栏 Tab 系统注册：`ctx.sidebarRightTabs.register({ id, kind: 'ssh-files', ... })` 声明页型与引导页入口，再把面板主体挂到 `sidebar.right.pane.tab` 槽位（key = 注册 id）；不再占用 details 栏，也不修改任何 shipped 插件的源码。`ssh2` 是插件自己的运行期依赖（`dependencies`），由 profile 的 pnpm 装进插件 `node_modules`，构建时按外部依赖排除（不打包进产物，避免其 emscripten 回退代码在 ESM 下引用 `__dirname` 出错）；profile 的 `pnpm-workspace.yaml` 里 `allowBuilds` 把 `ssh2` / `cpu-features` 置 `false` 跳过原生构建，ssh2 自动回退纯 JS 实现。

## 安装（web profile）

harness 0.1.5 起客户端插件必须是预编译产物（宿主端 `lib/index.js` + 浏览器端 `lib/client.js`），本仓库自带独立构建器 `build/client-bundle.mjs`（esbuild + lightningcss）：

```powershell
# 1) 插件目录内安装依赖（类型包 + esbuild/lightningcss + ssh2）
cd plugins\dsh-ssh-files
npm install --legacy-peer-deps
npm approve-scripts esbuild@0.28.2   # npm 11 默认拦截安装脚本
npm rebuild esbuild

# 2) 构建（宿主端打包本地模块；客户端产出 __ModuleLoader__ 工厂）
node E:\DSH\build\client-bundle.mjs E:\DSH\plugins\dsh-ssh-files

# 3) 首次安装到 web profile（需要 pnpm，可 corepack enable 获取）
dsh plugin --profile web add "file:E:/DSH/plugins/dsh-ssh-files"

# 4) 之后每次改动：构建 + 部署一步到位（profile 里是拷贝而非软链）
powershell -File E:\DSH\scripts\deploy-plugin.ps1 dsh-ssh-files

# 5) 重启 dsh web 服务
```

`dsh plugin add` 会自动把该包加入 `dsh.profile.bundles`，其 `cordis.patch.yml` 会挂载 `ssh-files` 行；浏览器半部由 `dsh.client` 扫描器自动进入 `window.__DSH_BOOT__`。

验证：

```powershell
# 组合配置里应出现 ssh-files 行
dsh web --dump-config | Select-String ssh-files
# 前端 bundle 被服务
Invoke-WebRequest 'http://127.0.0.1:3080/plugins/@deepseek-ai%2Fdsh-ssh-files/client.js'
# 面板路由：POST JSON（payload 带 sessionId），响应 {ok:true,value} 或 {ok:false,error}
# 路由受浏览器会话鉴权保护（裸调 401）——正常验证 = 打开 Web 界面右侧栏的「SSH 文件」并连接
```

## 配置

`cordis.patch.yml` 中 `ssh-files` 行支持以下 Config 字段（部署时可按需覆盖）：

| 字段 | 默认 | 说明 |
|---|---|---|
| `readMaxBytes` | `1048576` | 单次读取文本文件的大小上限（字节），超过则拒绝在面板中编辑 |
| `connectTimeoutMs` | `15000` | SSH 握手超时（毫秒） |
| `opTimeoutMs` | `120000` | 单次 SFTP 操作超时（毫秒）：服务器在期限内未响应即断开连接并报错，避免写入/读取永久悬挂 |
| `writeMaxChars` | `200000` | 模型 `ssh_write` 单次内容上限（字符） |
| `readMaxLines` | `2000` | 模型 `ssh_read` 单次返回行数上限 |
| `execMaxChars` | `20000` | 模型 `ssh_exec` 单条命令捕获输出上限（字符） |
| `code` | `code` | 旧「本地模式」打开代码文件的程序（PATH 名或绝对路径；面板改为纯 SSH 后端点保留备用） |
| `marktext` | `marktext` | 同上，打开 Markdown 的程序 |

## 安全说明

服务器密码以明文保存在 `~/.dsh/ssh-files/state.json`（与 `~/.ssh/config` 同级的本机信任边界）。`/ssh-files` 路由挂在应用 HTTP 服务上，先经 connection 服务的 Host/Origin 校验与浏览器会话鉴权（`requestRejection`）再落到处理器，与 `/api` 同级。

## 卸载

```powershell
dsh plugin --profile web remove @deepseek-ai/dsh-ssh-files
```

如需同时删除服务器记录：`Remove-Item "$env:USERPROFILE\.dsh\ssh-files" -Recurse`。
