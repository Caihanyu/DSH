// 生成 DeepSeek Harness 桌面图标(多尺寸 .ico)
// 用法: npm run icon   (等价于 electron assets/build-icon.js)
//
// 说明:
//   图形取自官方前端 favicon.svg 的鲸鱼轮廓,保持 Harness 原始观感(纯黑鲸鱼 + 透明底)。
//   先离屏渲染一张高分辨率母图(等待非空白帧),再用 nativeImage 高质量缩放各尺寸,
//   避免逐尺寸离屏渲染时拿到空白首帧(旧版问题:小尺寸条目全透明,图标显示成一片白)。

const { app, BrowserWindow, nativeImage, nativeTheme } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');

// 固定 1:1 像素比,避免系统缩放影响输出尺寸
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.disableHardwareAcceleration();

// 离屏窗口逐个销毁时不要退出应用
app.on('window-all-closed', () => { /* 由脚本自行退出 */ });

const ASSETS = __dirname;
const ICO_OUT = path.join(ASSETS, 'harness.ico');
const SVG_OUT = path.join(ASSETS, 'icon.svg');
const PNG_OUT = path.join(ASSETS, 'harness-256.png');
const SVG_SOURCE = path.join(ASSETS, 'icon-source.svg');   // 官方 favicon 副本

const MASTER_SIZE = 512;
const SIZES = [256, 128, 64, 48, 32, 16];

/** 在 ~/.dsh 下寻找官方 favicon.svg(鲸鱼图形来源) */
function findFavicon() {
  const roots = [
    path.join(os.homedir(), '.dsh', 'profiles', 'node_modules', '@deepseek-ai'),
    path.join(ASSETS, '..', '..', 'node_modules', '@deepseek-ai'),
  ];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root)) {
      if (!entry.startsWith('dsh-web-frontend')) continue;
      const candidate = path.join(root, entry, 'dist', 'favicon.svg');
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

/** 取得鲸鱼 path 数据:官方 favicon -> 本地副本 -> 已生成的 icon.svg */
function readWhalePath() {
  const candidates = [findFavicon(), SVG_SOURCE, SVG_OUT].filter(Boolean);
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const source = fs.readFileSync(candidate, 'utf8');
    const match = source.match(/\sd="([^"]+)"/);
    if (match) {
      if (candidate !== SVG_OUT) fs.writeFileSync(SVG_SOURCE, source);   // 留一份官方图形副本
      return match[1];
    }
  }
  throw new Error('未能找到 favicon.svg,无法取得图标路径数据');
}

/** 组合图标:与官方 favicon 一致的纯黑鲸鱼 + 透明底 */
function buildSvg(whale, size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 50 50">
  <path d="${whale}" fill="#000000" fill-rule="nonzero"/>
</svg>
`;
}

/** 判断图像是否全透明(离屏首帧可能是空白帧) */
function isBlank(image) {
  const bitmap = image.toBitmap();   // BGRA
  for (let i = 3; i < bitmap.length; i += 4) {
    if (bitmap[i] !== 0) return false;
  }
  return true;
}

/** 离屏渲染:返回指定尺寸的 PNG Buffer(确保拿到非空白帧) */
function renderPng(svg, size) {
  return new Promise((resolve, reject) => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      html,body{margin:0;padding:0;width:${size}px;height:${size}px;background:transparent;overflow:hidden}
      svg{display:block;width:${size}px;height:${size}px}
    </style></head><body>${svg}</body></html>`;

    const win = new BrowserWindow({
      width: size,
      height: size,
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      useContentSize: true,
      webPreferences: { offscreen: true, zoomFactor: 1, nodeIntegration: false, contextIsolation: true },
    });

    let settled = false;
    const finish = (fn) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { win.destroy(); } catch { /* ignore */ }
      fn();
    };

    const timer = setTimeout(() => finish(() => reject(new Error(`渲染超时: ${size}px`))), 30000);

    win.webContents.on('paint', (_event, _dirty, image) => {
      const actual = image.getSize();
      if (actual.width !== size || actual.height !== size) return;
      if (isBlank(image)) return;                 // 跳过空白帧,继续等下一帧
      const png = image.toPNG();
      finish(() => resolve(png));
    });

    win.webContents.once('did-finish-load', () => win.webContents.invalidate());
    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  });
}

/** 将多张 PNG 打包为 .ico(Vista+ 支持 PNG 压缩条目) */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + 16 * entries.length;
  entries.forEach((entry, i) => {
    const b = dir.subarray(i * 16, i * 16 + 16);
    b[0] = entry.size >= 256 ? 0 : entry.size;   // 宽(0 表示 256)
    b[1] = entry.size >= 256 ? 0 : entry.size;   // 高
    b[2] = 0;                                    // 调色板数
    b[3] = 0;                                    // 保留
    b.writeUInt16LE(1, 4);                       // 色彩平面
    b.writeUInt16LE(32, 6);                      // 位深
    b.writeUInt32LE(entry.png.length, 8);        // 数据大小
    b.writeUInt32LE(offset, 12);                 // 数据偏移
    offset += entry.png.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.png)]);
}

app.whenReady().then(async () => {
  try {
    nativeTheme.themeSource = 'light';                 // 固定浅色渲染,不跟随系统
    const whale = readWhalePath();
    const svg = buildSvg(whale, MASTER_SIZE);
    fs.writeFileSync(SVG_OUT, svg, 'utf8');
    console.log('[icon] 已写入 icon.svg(纯黑鲸鱼 + 透明底)');

    // 1) 渲染高分辨率母图
    const masterPng = await renderPng(svg, MASTER_SIZE);
    console.log(`[icon] 母图 ${MASTER_SIZE}x${MASTER_SIZE} 渲染完成 (${masterPng.length} bytes)`);

    // 2) 高质量缩放各尺寸
    const master = nativeImage.createFromBuffer(masterPng);
    const entries = SIZES.map((size) => {
      const png = master.resize({ width: size, height: size, quality: 'best' }).toPNG();
      console.log(`[icon] ${size}x${size} -> ${png.length} bytes`);
      return { size, png };
    });

    // 3) 输出
    fs.writeFileSync(PNG_OUT, entries.find((e) => e.size === 256).png);
    fs.writeFileSync(ICO_OUT, buildIco(entries));
    console.log(`[icon] 已生成 ${ICO_OUT} (${SIZES.join('/')} px)`);
    app.exit(0);
  } catch (err) {
    console.error('[icon] 失败: ' + err.message);
    app.exit(1);
  }
});
