# DeepSeek Harness 后台服务启动器(开机自启用,不打开窗口)
# 适配: npm 安装版(@deepseek-ai/dsh),非源码仓库版
$ErrorActionPreference = 'SilentlyContinue'
$repo = $PSScriptRoot
$port = 3080

# 刷新 PATH,确保 node 可用(旧终端会话可能没有更新后的 PATH)
$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
# 本机系统代理(Clash @ 127.0.0.1:7897);按需修改
$env:HTTP_PROXY = 'http://127.0.0.1:7897'
$env:HTTPS_PROXY = 'http://127.0.0.1:7897'

# 已在运行则直接退出
if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { exit 0 }

# 无窗口后台启动 dsh web(直接用 node 运行 npm 安装的 CLI),日志写入 server.log
$node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (-not $node) { exit 1 }
$dshBin = Join-Path $repo 'node_modules\@deepseek-ai\dsh\lib\bin.js'
if (-not (Test-Path $dshBin)) { exit 1 }
$log = Join-Path $repo 'server.log'
$argsList = @('"' + $dshBin + '"', 'web', '--no-open')
Start-Process -FilePath $node -ArgumentList $argsList -WorkingDirectory $repo -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError "$log.err"

# 等服务就绪(最多 60 秒);失败时把原因写进日志而不是静默退出——
# 这是开机自启路径,静默失败会让浏览器只看到"拒绝连接"。
for ($i = 0; $i -lt 120; $i++) {
  if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { exit 0 }
  Start-Sleep -Milliseconds 500
}
$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
Add-Content -Path $log -Value "[$stamp] launch-server: dsh web 未能在 60 秒内监听 $port,请查看 server.log.err" -ErrorAction SilentlyContinue
exit 1
