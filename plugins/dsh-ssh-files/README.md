# dsh-ssh-files

SSH 远程文件访问 —— 一个**可选的 profile 插件**，不包含在 harness 的 `dsh-base` / `dsh-web-app` 发布 bundle 里。

在 Web 界面的对话右侧（`details` 栏）提供一个**本地 / SSH 双工作方式**的文件面板：

- **本地模式**：浏览当前会话工作区及本机文件系统，单击代码文件在 VS Code 打开、Markdown 用 MarkText 打开、其它文件用默认应用打开；同时支持面板内直接查看与编辑保存本地文本文件
- **SSH 模式**：记录多台服务器，选择并连接某一台（支持密码 / 私钥文件 / SSH Agent 认证），浏览远程目录树，**面板内直接读写远程文本文件**（新建 / 编辑 / 保存 / 删除 / 建目录）
- **模型可用的 `ssh_*` 工具**：连接后，对话中的模型可以直接调用 `ssh_status` / `ssh_connect` / `ssh_list` / `ssh_read` / `ssh_write` / `ssh_mkdir` / `ssh_rm` / `ssh_exec` 在服务器上干活（读改写文件、跑远程命令）——会话的工具提示会说明这套工具，SSH 会话与本地会话的模型能力互不影响
- **会话隔离**：每个对话**各自记住**自己的工作方式与服务器，并拥有**各自独立的 SSH 连接**。会话 A 连服务器 X、会话 B 连服务器 Y，两者互不串扰；A 断开或切回本地不影响 B。全新对话默认继承"最近一次使用"的设置
- **工作方式记忆**：记住最近一次使用的方式与最近连接的服务器，下次打开自动回到该状态

```
┌──────────────────────────────────────────────┐
│ [本地] [SSH]         [服务器▾] [连接] [⚙] [✕] │
├──────────────────────────────────────────────┤
│ 目录树（本地 = 会话 cwd；SSH = 服务器目录）       │
│   · 行内 ⋯ 菜单：新建文件/目录、删除、           │
│     本地模式还有 VS Code / MarkText / 默认打开    │
│   · 点击文件 → 内置编辑器：查看、修改、保存       │
└──────────────────────────────────────────────┘
```

## 为什么是插件（与 harness 本体的关系）

| 层面 | 实现 | 与更新的关系 |
|---|---|---|
| **发布 bundle** | 不在 `dsh-base` / `dsh-web-app` 的 `cordis.patch.yml` 中，**没有任何内置 profile 模板引用它** | harness 更新不会自动启用/关闭它 |
| **服务端半部** | 独立 cordis 插件，注册自己的 `/ssh-files` RPC 通道，内含 ssh2 连接管理 + SFTP 文件操作 | 通过 profile 的 `cordis.patch.yml` 挂载，与核心并行 |
| **浏览器半部** | `dsh.client` 包，前端 bundle 在运行时动态加载（`/plugins/<id>/client.js`），**不编译进主程序** | 前端 bundle 由 `dsh.client` 扫描器按 package 发现 |
| **安装位置** | `$DSH_HOME/profiles/web/node_modules`（`dsh plugin` 管理） | harness 的 `git pull` / 重新构建不会触碰它 |
| **数据** | 服务器记录与工作方式存于 `~/.dsh/ssh-files/state.json`（`resolveDshHome` 之下） | 不随仓库更新变动 |

前端使用 slots 机制把 shipped 的 DetailsPanel（以及同优先级的其它面板）以负优先级 shadow 掉；不修改任何 shipped 插件的源码。`ssh2` 以 devDependency 参与构建，运行时按外部依赖从插件自身 `node_modules` 解析（不打包进产物，避免其 emscripten 回退代码在 ESM 下引用 `__dirname` 出错）；`cpu-features` 原生绑定在 `pnpm-workspace.yaml` 中禁止构建，ssh2 自动回退纯 JS 实现。

## 安装（web profile）

前置：仓库根已 `pnpm install`（会安装本插件的 `ssh2` 构建依赖；`pnpm-workspace.yaml` 已声明 `ssh2: false` / `cpu-features: false` 跳过其原生构建脚本）。

在仓库根目录执行（路径含空格时建议先建一个无空格 junction，如 `d:\dsh-ssh-link`）：

```powershell
# 1) 构建插件（tsc 类型 + host/client 两个 tsdown 面；产物在 packages/extensions/dsh-ssh-files/lib）
pnpm exec tsc -b packages/extensions/dsh-ssh-files
Set-Location packages/extensions/dsh-ssh-files
pnpm exec tsdown --env.DSH_BUILD_FACE host
pnpm exec tsdown --env.DSH_BUILD_FACE client
Set-Location ..\..\..

# 2) 安装到 web profile（link: 用 junction 实时链接，仓库重构建后立即生效）
node --import tsx/esm apps/cli/src/bin.ts plugin --profile web add "link:d:/dsh-ssh-link"

# 3) 重启 dsh web 服务（launch-server.ps1 干净重启）即可
```

`dsh plugin add` 会自动把该包加入 `dsh.profile.bundles`，其 `cordis.patch.yml` 会挂载 `ssh-files` 行；浏览器半部由 `dsh.client` 扫描器自动进入 `window.__DSH_BOOT__`。

验证：

```powershell
# 组合配置里应出现 ssh-files 行
node --import tsx/esm apps/cli/src/bin.ts --profile web --dump-config | Select-String ssh-files
# 前端 bundle 被服务
Invoke-WebRequest 'http://127.0.0.1:3080/plugins/@deepseek-ai%2Fdsh-ssh-files/client.js'
# 状态 RPC
$b = '{"type":"client-request","rpcId":"t","method":"get-state","payload":{}}'
Invoke-WebRequest 'http://127.0.0.1:3080/ssh-files/get-state' -Method Post -Body $b -ContentType 'application/json'
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
| `code` | `code` | 打开代码文件的程序（PATH 名或绝对路径） |
| `marktext` | `marktext` | 打开 Markdown 的程序（PATH 名或绝对路径） |

## 安全说明

服务器密码以明文保存在 `~/.dsh/ssh-files/state.json`（与 `~/.ssh/config` 同级的本机信任边界）。RPC 通道仅限 loopback（`authority: 'loopback'`），与 `/api` 同级。

## 卸载

```powershell
node --import tsx/esm apps/cli/src/bin.ts plugin --profile web remove @deepseek-ai/dsh-ssh-files
```

如需同时删除服务器记录：`Remove-Item "$env:USERPROFILE\.dsh\ssh-files" -Recurse`。
