# DeepSeek Harness 个人插件与配置 (DSH)

本仓库备份并分享我在 **DeepSeek Harness** (deepseek-ai/deepseek-harness) 上自研的
profile 级扩展插件、agent 预设与 Windows 启动脚本。所有插件均为**可选 profile 插件**，
不在官方 `dsh-base` / `dsh-web-app` bundle 中，harness 本体更新不会影响它们。

## 目录结构

```
DSH/
├── plugins/                        # 自研 profile 级插件(源码 + lib 构建产物)
│   ├── dsh-ssh-files/              # SSH 远程文件面板 + 模型 ssh_* 工具
│   └── dsh-workspace-files/        # 工作区文件浏览器(VS Code / MarkText 打开)
├── config/                         # 运行时配置(需手动放置到 ~/.dsh)
│   ├── settings.yaml               # 全局设置(默认 agent 预设、默认模型等)
│   └── agent-presets/              # agent 预设(复制到 ~/.dsh/.agent-presets/)
│       ├── dsh-anchored-subagent/  # Minimal → 完整工具目录的锚定开局
│       └── minimal-win/            # Windows 双工具编码 Agent(pwsh + str_replace_editor)
└── scripts/                        # 本机启动脚本(放在 DSH 仓库根目录使用)
    ├── launch-server.ps1           # 无窗口后台启动 dsh web(开机自启用)
    └── launch-desktop.ps1          # 桌面快捷方式:拉起服务 + Edge 独立窗口
```

## plugins/ — 自研插件

两个插件均含 `src/` 源码与 `lib/` 构建产物(tsdown host/client 两面包),不含
`node_modules`(依赖由 DSH 主仓库 workspace 提供)。详细功能与安装方法见各插件
README:

- [dsh-ssh-files](plugins/dsh-ssh-files/README.md) — SSH 远程文件访问:
  右侧详情栏本地/SSH 双模式文件面板、多服务器管理、SFTP 读写,
  以及模型可用的 `ssh_status/ssh_connect/ssh_list/ssh_read/ssh_write/ssh_mkdir/
  ssh_rm/ssh_exec` 工具。会话隔离、自动回连。
- [dsh-workspace-files](plugins/dsh-workspace-files/README.md) — 工作区文件浏览器:
  当前会话目录树,代码在 VS Code、Markdown 在 MarkText 打开,附工具调用查看页签。

安装到 web profile 的通用方式(以 ssh-files 为例,路径含空格时先建无空格 junction):

```powershell
# 1) 构建(在 DSH 主仓库根目录,先 pnpm install)
pnpm exec tsc -b packages/extensions/dsh-ssh-files
Set-Location packages/extensions/dsh-ssh-files
pnpm exec tsdown --env.DSH_BUILD_FACE host
pnpm exec tsdown --env.DSH_BUILD_FACE client
Set-Location ..\..\..

# 2) 安装到 web profile(link: 实时链接)
node --import tsx/esm apps/cli/src/bin.ts plugin --profile web add "link:d:/dsh-ssh-link"

# 3) 重启 dsh web 服务
```

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
