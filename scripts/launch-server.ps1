# DeepSeek Harness 后台服务启动器(开机自启用,不打开窗口)
$ErrorActionPreference = 'SilentlyContinue'
$repo = $PSScriptRoot
$port = 3080

# 刷新 PATH,确保 node/pnpm 可用
$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
$env:HTTP_PROXY = 'http://127.0.0.1:7890'
$env:HTTPS_PROXY = 'http://127.0.0.1:7890'

# 已在运行则直接退出
if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { exit 0 }

# 无窗口后台启动 dsh web(直接用 node),日志写入 server.log
$node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (-not $node) { exit 1 }
$log = Join-Path $repo 'server.log'
Start-Process -FilePath $node -ArgumentList '--import','tsx/esm','apps/cli/src/bin.ts','web' -WorkingDirectory $repo -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError "$log.err"
