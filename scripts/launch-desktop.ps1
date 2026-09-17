# DeepSeek Harness 桌面启动器
# 行为:
#   1) 优先启动 Electron 桌面外壳(自定义标题栏,含刷新/重启按钮;全程无 PowerShell 窗口)
#   2) 未安装 Electron 时回退为 Edge/Chrome 独立应用窗口模式
# 适配: npm 安装版(@deepseek-ai/dsh),非源码仓库版

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$repo = $PSScriptRoot
$port = 3080
$url = "http://127.0.0.1:$port"

# 刷新 PATH,确保 node 可用(旧终端会话可能没有更新后的 PATH)
$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
# 走系统代理:探测常见 Clash 端口(7890/7897),不设置时 GitHub 等域名可能不通
# (可用 DSH_PROXY 环境变量直接指定)
if ($env:DSH_PROXY) {
    $env:HTTP_PROXY = $env:DSH_PROXY
    $env:HTTPS_PROXY = $env:DSH_PROXY
} else {
    $proxyPort = @(7890, 7897) | Where-Object { Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue } | Select-Object -First 1
    if ($proxyPort) {
        $env:HTTP_PROXY = "http://127.0.0.1:$proxyPort"
        $env:HTTPS_PROXY = "http://127.0.0.1:$proxyPort"
    }
}

# ---------- 1) Electron 桌面外壳(首选) ----------
$desktopApp = Join-Path $repo 'desktop'
$electron = Join-Path $desktopApp 'node_modules\electron\dist\electron.exe'
if ((Test-Path $electron) -and (Test-Path (Join-Path $desktopApp 'main.js'))) {
    # electron.exe 为 GUI 程序,不会弹出控制台窗口;dsh 服务由其自行守护
    Start-Process -FilePath $electron -ArgumentList ('"' + $desktopApp + '"') -WorkingDirectory $desktopApp
    exit 0
}

# ---------- 2) 回退:Edge/Chrome 应用窗口 ----------
$isRunning = $null -ne (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)

if (-not $isRunning) {
    # 调用无窗口服务启动脚本(node 直启,日志写入 server.log)
    & (Join-Path $repo 'launch-server.ps1')

    # 等待端口就绪,最多 90 秒
    $ready = $false
    for ($i = 0; $i -lt 90; $i++) {
        Start-Sleep -Seconds 1
        if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { $ready = $true; break }
    }
    if (-not $ready) {
        [System.Windows.Forms.MessageBox]::Show('DeepSeek Harness 服务启动超时,请尝试重新运行本脚本,或手动运行 launch-server.ps1 后查看 server.log', '启动失败')
        exit 1
    }
}

# 定位浏览器(优先 Edge,其次 Chrome):先查注册表 App Paths,再试常见安装路径
$edge = $null
foreach ($key in @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe',
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe',
    'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe',
    'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe'
)) {
    $candidate = (Get-ItemProperty -Path $key -ErrorAction SilentlyContinue).'(default)'
    if ($candidate -and (Test-Path $candidate)) { $edge = $candidate; break }
}
if (-not $edge) {
    $edge = @(
        'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
        "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe",
        'C:\Program Files\Google\Chrome\Application\chrome.exe',
        'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
}

if (-not $edge) {
    [System.Windows.Forms.MessageBox]::Show('未找到 Microsoft Edge 或 Chrome 浏览器,请先安装其中一个。', '启动失败')
    exit 1
}

# 以独立应用窗口打开(无地址栏、无标签页,窗口图标使用站点 favicon)
Start-Process -FilePath $edge -ArgumentList "--app=$url"
