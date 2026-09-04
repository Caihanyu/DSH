# dsh-workspace-files

工作区文件浏览器 —— 一个**可选的 profile 插件**，不包含在 harness 的 `dsh-base` / `dsh-web-app` 发布 bundle 里。

在 Web 界面的对话右侧（`details` 栏）显示当前会话工作区的文件目录树：

- **代码/脚本文件**（`.ts/.tsx/.py/.vue/.json/...`、`Dockerfile`、`.env*` 等）→ 单击在 **VS Code** 中打开
- **Markdown 文件**（`.md/.markdown/...`）→ 单击用 **MarkText** 打开
- **其它文件** → 默认应用打开；每个文件还有"⋯"菜单可任选三种打开方式
- 目录懒加载展开；隐藏文件（点开头）默认过滤，可切换显示
- 第二个"工具"页签列出当前会话窗口内的工具调用，可查看输入/输出

## 为什么是插件（与 harness 本体的关系）

| 层面 | 实现 | 与更新的关系 |
|---|---|---|
| **发布 bundle** | 不在 `dsh-base` / `dsh-web-app` 的 `cordis.patch.yml` 中，**没有任何内置 profile 模板引用它** | harness 更新不会自动启用/关闭它 |
| **服务端半部** | 一个独立 cordis 插件，注册自己的 `/workspace-files` RPC 通道 | 通过 profile 的 `cordis.patch.yml` 挂载，与核心并行 |
| **浏览器半部** | `dsh.client` 包，前端 bundle 在运行时动态加载（`/plugins/<id>/client.js`），**不编译进主程序** | 前端 bundle 由 `dsh.client` 扫描器按 package 发现 |
| **安装位置** | `$DSH_HOME/profiles/web/node_modules`（`dsh plugin` 管理） | harness 的 `git pull` / 重新构建不会触碰它 |

前端使用 slots 机制把 shipped 的 DetailsPanel 以负优先级 shadow 掉（面板自身提供"文件/工具"双页签，工具详情功能保留）；不修改任何 shipped 插件的源码。

## 安装（web profile）

在仓库根目录执行（路径含空格时建议先建一个无空格 junction，如 `d:\dsh-wf-link`）：

```powershell
# 1) 构建插件（host + client 两个面；产物在 packages/extensions/dsh-workspace-files/lib）
node --import tsx/esm apps/cli/src/bin.ts --help  # 确认 CLI 可用
pnpm exec tsc -b packages/extensions/dsh-workspace-files
pnpm exec tsdown --env.DSH_BUILD_FACE host --filter @deepseek-ai/dsh-workspace-files
$env:DSH_BUILD_FACE='client'; pnpm --filter @deepseek-ai/dsh-workspace-files run bundle

# 2) 安装到 web profile（link: 用符号链接，仓库重构建后立即生效；file: 用副本）
node --import tsx/esm apps/cli/src/bin.ts plugin --profile web add "link:d:/dsh-wf-link"

# 3) 重启 dsh web 服务即可
```

`dsh plugin add` 会自动把该包加入 `dsh.profile.bundles`（因为它声明了 `dsh.bundle`），其 `cordis.patch.yml` 会挂载 `workspace-files` 行；浏览器半部由 `dsh.client` 扫描器自动进入 `window.__DSH_BOOT__`。

验证：

```powershell
# 组合配置里应出现 workspace-files 行
node --import tsx/esm apps/cli/src/bin.ts --profile web --dump-config | Select-String workspace-files
# 前端 bundle 被服务
Invoke-WebRequest 'http://127.0.0.1:3080/plugins/@deepseek-ai%2Fdsh-workspace-files/client.js'
# 列目录 RPC
$b = '{"type":"client-request","rpcId":"t","method":"list","payload":{"path":"d:/"}}'
Invoke-WebRequest 'http://127.0.0.1:3080/workspace-files/list' -Method Post -Body $b -ContentType 'application/json'
```

## 卸载

```powershell
node --import tsx/esm apps/cli/src/bin.ts plugin --profile web remove @deepseek-ai/dsh-workspace-files
```

## 配置打开程序

`code` / `marktext` 默认按 PATH 解析（Windows 上会经 PowerShell 桥接，兼容 `code.cmd` 这类 shim）。可执行文件不在 PATH 时，在 `$DSH_HOME/profiles/web/cordis.patch.yml` 里覆盖：

```yaml
- id: workspace-files
  config:
    code: 'D:\Microsoft VS Code\bin\code.cmd'
    marktext: 'C:\Program Files\MarkText\MarkText.exe'
```

## 与 harness 更新解耦的机制

- 插件行由 profile 层的补丁挂载，不写进任何 shipped bundle 的 `cordis.patch.yml`；
- 浏览器 bundle 是运行时动态 fetch 的闭包工厂（`window.__ModuleLoader__.load({id, factory})`），只依赖模块表中的 `react` / `cordis` / `ui-slots` / `ui-primitives`（基线常驻），不内联任何 shipped 包，所以 harness 前端版本演进不会与它产生符号冲突；
- 它占用的 `details` 槽位是 ui-layout 声明的公开扩展点；shadow 语义（负优先级）是 slots 系统文档化的行为。

## 抽离为仓库外独立项目

当前包位于仓库内（`packages/extensions/dsh-workspace-files`）是为了借用仓库的 tsdown `clientBundle` 预设可靠地产出两端产物；运行时它已是 profile 级插件，与核心完全解耦。若要在物理上移出仓库：

1. 把 `src/`、`cordis.patch.yml`、`package.json`、`tsdown.config.ts` 复制到独立仓库；
2. 在独立项目里复制 `packages/client/tsdown.client.ts` 的 `clientBundle` 预设（约 150 行），或改用等价的 rollup/esbuild 配置产出闭包工厂 bundle；
3. `package.json` 的 `workspace:*` 依赖改为 npm 发布版或 `file:` 指向 harness 的 node_modules（npm 上 `@deepseek-ai/*` 目前只有 `0.0.1-rc.1` 旧版，建议直接 `link:` 本地）；
4. 发布后即可 `dsh plugin add <npm包名>`。
