# DeepSeek Harness 桌面启动器
# 行为:若 Web 服务未运行则后台启动,然后以 Edge 独立应用窗口打开(无地址栏/标签页)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$repo = $PSScriptRoot
$port = 3080
$url = "http://127.0.0.1:$port"

# 刷新 PATH,确保 node/pnpm 可用(旧终端会话可能没有更新后的 PATH)
$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
# 走系统代理(Clash @ 127.0.0.1:7890),不设置时 GitHub 等域名可能不通
$env:HTTP_PROXY = 'http://127.0.0.1:7890'
$env:HTTPS_PROXY = 'http://127.0.0.1:7890'

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
        [System.Windows.Forms.MessageBox]::Show('DeepSeek Harness 服务启动超时,请打开终端手动运行:pnpm dsh web', '启动失败')
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
