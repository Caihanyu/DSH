# DeepSeek Harness 桌面外壳(Electron)

把 `dsh web` 的 Web 界面包装成一个独立桌面应用:自定义标题栏、无控制台窗口、自带服务启停管理。

## 启动方式

- **桌面快捷方式**:`DeepSeek Harness`(指向 `desktop\node_modules\electron\dist\electron.exe`,图标为 `desktop\assets\harness.ico`)
- **命令行**:`npm start`(在 `desktop` 目录内)

快捷方式直接调用 `electron.exe`(GUI 程序),因此**不会闪现 PowerShell 窗口**;服务由外壳内部以隐藏窗口方式拉起。

## 标题栏按钮(右上角)

| 按钮 | 作用 | 快捷键 |
| --- | --- | --- |
| ⟳ 刷新 | 重启 Harness 服务(杀掉 3080 端口进程 → 重新拉起 → 重新加载界面) | `Ctrl+Shift+R` |
| ─ 最小化 | 最小化窗口 | — |
| ▢ 最大化 | 最大化 / 还原 | — |
| ✕ 关闭 | 关闭窗口(后台服务继续运行) | — |

另外 `F5` / `Ctrl+R` 为普通页面刷新(不重启服务)。

## 工作原理

```
BaseWindow(无边框)
├── 视图 1:titlebar  shell.html + preload.js  → 自定义标题栏
└── 视图 2:appView   http://127.0.0.1:3080    → Harness 界面
```

- 服务生命周期:`main.js` 检测 3080 端口 → 未监听则用 `node node_modules\@deepseek-ai\dsh\lib\bin.js web --no-open` 拉起(`windowsHide: true`,无窗口),日志追加写入仓库根目录的 `server.log` / `server.log.err`。
- 服务以 `detached` 方式启动,**关闭应用后服务继续运行**;需要停掉时用标题栏的刷新按钮重启即可。
- 启动中/重启中/连接失败时,内容区显示带进度的占位页;失败会提示错误原因。
- 标题栏配色跟随 Harness 页面主题(在页面加载完成、窗口重新获得焦点时同步一次)。

## 图标

`assets/harness.ico` 由 `assets/build-icon.js` 生成:从官方前端 `favicon.svg` 提取鲸鱼轮廓,保持 Harness 原本观感(纯黑鲸鱼 + 透明底);先离屏渲染一张 512×512 母图,再用 `nativeImage` 高质量缩放为 256/128/64/48/32/16 六个尺寸并打包为 ico。

> ⚠️ 不要逐个尺寸去离屏渲染:那样容易拿到空白首帧,小尺寸条目会变成全透明,桌面图标就显示成一片白(旧版踩过的坑)。

图形更新后重新生成:

```powershell
cd desktop
npm run icon
```

`assets/icon-source.svg` 是官方 favicon 的本地副本,离线也能重建图标。标题栏里的图标(18px)同样是黑色鲸鱼,深色主题下会自动反色。

## 相关文件

| 文件 | 说明 |
| --- | --- |
| `main.js` | 主进程:窗口/视图、服务启停、IPC |
| `shell.html` / `shell.js` | 标题栏界面与交互 |
| `preload.js` | 标题栏的 IPC 桥接(contextBridge) |
| `loading.html` | 启动/重启占位页 |
| `assets/harness.ico` | 应用图标(快捷方式 + 窗口/任务栏) |
| `assets/harness-256.png` | 标题栏 18px 小图标源文件 |
| `assets/icon-source.svg` | 官方 favicon 本地副本 |
| `assets/build-icon.js` | 图标生成脚本 |

## 常见调整

- **代理**:`main.js` 顶部的 `DEFAULT_PROXY`(默认 `http://127.0.0.1:7897`),仅当环境变量里没有代理设置时生效。
- **窗口默认尺寸**:`main.js` 的 `createWindow()`;窗口位置/大小会记忆在 `%APPDATA%\DeepSeek Harness\window-state.json`。
- **端口**:`main.js` 顶部的 `PORT`(默认 3080)。
