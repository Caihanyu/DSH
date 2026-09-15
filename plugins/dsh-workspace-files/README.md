# dsh-workspace-files

工作区文件浏览器 —— 一个**可选的 profile 插件**，不包含在 harness 的 `dsh-base` / `dsh-web-app` 发布 bundle 里。

> **兼容性：适配 DeepSeek Harness 0.1.6**（在 `0.1.6-alpha.1` 上实测运行）。
> 0.1.5 时代的实现（shadow `details` 槽位 + `ctx.connection.rpc.handle()`）已不再使用：
> 现在靠 `ctx.sidebarRightTabs.register()` 接管右侧边栏页签，并自建 `/workspace-files` 前缀路由。

在 Web 界面右侧边栏的「工作区文件」页签里显示当前会话工作区的目录树：

- **接管内置页签**：扩展注册覆盖内置的 `files` 类型（一个 kind 至多一个 builtin + 一个 extension，extension 生效），引导页只留一条入口，不会出现两个近乎相同的树。
- **双击打开**（单击不触发，避免误点就弹出外部软件），按文件类型路由：

  | 文件类型 | 打开方式 |
  |---|---|
  | Markdown（`.md/.markdown/.mdown/.mkd`） | 配置的 Markdown 编辑器（**Typora 优先，其次 MarkText**） |
  | 文档（`.doc/.docx/.xls/.xlsx/.ppt/.pptx/.pdf/.txt/.csv/.rtf` 等） | 配置的 **WPS Office** |
  | 代码/脚本（`.ts/.tsx/.py/.vue/.json/...`、`Dockerfile`、`.env*` 等） | 配置的 **VS Code** |
  | 其它 | 系统默认应用 |

- **「⋯」菜单**：与左侧工作区同款的**贴按钮弹出菜单**（ui-primitives 的 `Menu`），内容 = 在侧栏预览 / 用 Markdown 编辑器打开 / 用 WPS 打开 / 用 VS Code 打开 / 用默认应用打开，只列出已配置的软件。
- **首次运行设置向导**：第一次打开页签时弹窗询问是否允许自动查找本机这几个软件的启动路径，找不到可以手填；什么都不配置则本插件对 Harness 的文件打开行为**零影响**（详见下节）。
- 目录懒加载展开；隐藏文件（点开头）默认过滤、可切换；打开失败时树底部给出错误条与「重试 / 改用默认应用打开」（**打开成功不显示任何加载提示**）。

## 打开方式设置（首次运行向导）

第一次打开页签时自动弹出，之后可随时用树工具栏的**齿轮按钮**重新打开。

```
第一步  是否允许自动查找电脑上的 Typora / MarkText / WPS Office / VS Code 的启动路径？
        [不配置，保持原样]  [我自己填写路径]  [自动查找]
                    ↓ 自动查找
第二步  每行 = 勾选框 + 可编辑路径
        ☑ Typora      D:\Typora\Typora\Typora.exe
        ☐ MarkText    （未找到可手填）
        ☑ VS Code     E:\VScode\Microsoft VS Code\bin\code.cmd
        ☐ WPS Office  （未找到可手填）
        [不配置，保持原样]  [再全盘找一次]  [保存]
```

- **查找顺序**：插件配置值 → `PATH` → 常见安装位置（含各盘根目录，能认出 `D:\Typora\Typora\Typora.exe` 这类自定义安装）→ 注册表（`Uninstall` + `App Paths`）→（点「再全盘找一次」时）全盘 BFS。全盘只作为兜底，带 90 秒 / 12 万目录上限并跳过 `windows`、`node_modules`、`$Recycle.Bin` 等目录，可随时取消。
- **两个 md 编辑器都勾选时优先 Typora**；没找到的软件直接手填绝对路径（或 PATH 名字）即可。
- **「不配置，保持原样」**：所有路径留空且不勾选时，本插件**不接管文件打开行为** —— 行变成内置样式（单击 + 系统默认应用、没有「⋯」菜单），树底部提示可重新设置。
- 设置结果存到 `$DSH_HOME/workspace-files/config.json`（默认 `~/.dsh/workspace-files/config.json`），三个槽位：`markdown` / `code` / `office`。

## 与 harness 更新解耦的机制

| 层面 | 实现 | 与更新的关系 |
|---|---|---|
| **发布 bundle** | 不在 `dsh-base` / `dsh-web-app` 的 `cordis.patch.yml` 中，没有任何内置 profile 模板引用它 | harness 更新不会自动启用/关闭它 |
| **宿主端** | 独立 cordis 插件，靠 `ctx.inject(['webServer','connection'])` 注册自己的 `/workspace-files` 前缀路由（0.1.5+ 起 `ctx.connection.rpc.handle()` 对第三方插件不可用） | 通过 profile 的 `cordis.patch.yml` 挂载，与核心并行 |
| **浏览器端** | 预编译的闭包工厂 bundle，运行时按 `dsh.client` 清单加载；只依赖平台模块表（`react` / `cordis` / `ui-slots` / `ui-primitives` 等） | harness 前端版本演进不与它产生符号冲突 |
| **安装位置** | `$DSH_HOME/profiles/web/node_modules/@deepseek-ai/dsh-workspace-files` | harness 升级不会触碰它 |

> **依赖规则（重要）**：插件只把**宿主不提供的包**（本插件没有这类依赖）写进 `dependencies`；
> 凡是 `@deepseek-ai/*` 宿主已装的包（`dsh-tools`、`dsh-invariants`、`dsh-native-command`、
> `dsh-system-prompt`、`schemastery`…）只能放 `devDependencies`。
> 否则 pnpm 会在 profile 里再装一份副本，导致**同一个模块被加载两次**（两份不同的 `Symbol`），
> 表现为所有工具调用直接崩：`Cannot read properties of undefined (reading 'prepare')`。

## 构建与安装（本仓库自包含，不依赖 harness monorepo）

harness 0.1.5 起客户端插件必须是预编译产物（宿主端 `lib/index.js` + 浏览器端 `lib/client.js`），
而官方 `clientBundle` 预设只存在于 harness 仓库内，所以本仓库自带等价的构建器
`build/client-bundle.mjs`（esbuild + lightningcss）。

```powershell
# 1) 插件目录内装一次依赖（类型包 + esbuild/lightningcss）
cd E:\DSH\plugins\dsh-workspace-files
npm install --no-audit --no-fund              # ssh-files 那种带 ssh2 的插件需加 --legacy-peer-deps
npm approve-scripts esbuild@0.28.2            # npm 11 默认拦截安装脚本

# 2) 构建（宿主端打包本地模块；客户端产出 __ModuleLoader__ 闭包工厂）
node E:\DSH\build\client-bundle.mjs E:\DSH\plugins\dsh-workspace-files

# 3) 首次安装到 web profile（需要 pnpm，可 corepack enable 获取）
dsh plugin --profile web add file:E:/DSH/plugins/dsh-workspace-files

# 4) 以后每次改动：构建 + 部署一步到位，然后重启 dsh web
powershell -File E:\DSH\scripts\deploy-plugin.ps1 dsh-workspace-files
```

`deploy-plugin.ps1` 会调用构建器，再把 `lib/`、`cordis.patch.yml`、`package.json`
拷进 `~/.dsh/profiles/web/node_modules/@deepseek-ai/dsh-workspace-files`
（profile 里装的是**拷贝**而不是软链，所以每次重建都要重新部署一次）。

宿主端必须 `bundle: true` + `packages: 'external'`，否则 `lib/index.js` 里会残留
`./setup.ts` 之类的导入，装进 profile 后直接 `ERR_MODULE_NOT_FOUND`。

## 配置

插件配置项（`cordis.patch.yml` 的 `workspace-files-tab` 行）现在是**查找种子与兜底**：
向导写进 `config.json` 的路径优先，没有配置时才回退到这三个值。

```yaml
- id: workspace-files-tab
  config:
    code: code                      # VS Code 可执行文件（PATH 名或绝对路径）
    typora: typora                  # Typora，未装则回退 marktext
    marktext: marktext              # MarkText
```

## 卸载

```powershell
dsh plugin --profile web remove @deepseek-ai/dsh-workspace-files
```

设置文件不在 profile 里，需要的话手动删 `~/.dsh/workspace-files/config.json`
（删掉后下次打开页签会重新走首次设置向导）。

## 版本记录

- **0.2.0** — 适配 **harness 0.1.6**：右侧边栏页签接管（`sidebarRightTabs`）、
  双击打开、按类型路由（Markdown / 文档 / 代码）、贴按钮的「⋯」打开方式菜单、
  首次运行设置向导（查找 / 手填 / 零影响三选一）、去掉打开时的加载提示。
  依赖规则修正：宿主自带包只放 `devDependencies`（避免模块双实例）。
- **0.1.0** — 初版：shadow `details` 槽位的文件/工具双页签（harness 0.1.0–0.1.5 时代写法，已废弃）。
