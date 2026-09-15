'use strict';
// 标题栏渲染进程脚本(通过 preload 暴露的 window.harnessShell 与主进程通信)

const api = window.harnessShell;

const statusEl = document.getElementById('status');
const restartBtn = document.getElementById('btn-restart');
const maximizeBtn = document.getElementById('btn-maximize');

const ICON_MAXIMIZE = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.1" aria-hidden="true"><rect x="3" y="3" width="10" height="10" rx="1" /></svg>';
const ICON_RESTORE = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.1" aria-hidden="true"><rect x="5.5" y="2.5" width="8" height="8" rx="1" /><path d="M10.5 13.5H4a1.5 1.5 0 0 1-1.5-1.5V5.5" /></svg>';

document.getElementById('btn-minimize').addEventListener('click', () => api.minimize());
maximizeBtn.addEventListener('click', () => api.toggleMaximize());
document.getElementById('btn-close').addEventListener('click', () => api.close());
restartBtn.addEventListener('click', () => api.restartHarness());

/** 根据状态更新标题栏(重启中禁用按钮并显示提示) */
function applyState({ state, message, restarting: isRestarting }) {
  const busy = state === 'restarting' || isRestarting;

  restartBtn.classList.toggle('spinning', busy);
  restartBtn.disabled = busy;
  restartBtn.title = busy ? '正在重启 Harness…' : '重启 Harness(Ctrl+Shift+R)';

  const text = busy ? '正在重启…' : (state === 'starting' ? '正在启动…' : (state === 'error' ? (message || '启动失败') : ''));
  statusEl.textContent = text;
  statusEl.classList.toggle('visible', Boolean(text));
  statusEl.style.color = state === 'error' ? '#d93025' : '';
  statusEl.style.opacity = state === 'error' ? '0.95' : '';
}

/** 标题栏配色跟随 Harness 主题 */
function applyTheme(theme) {
  const root = document.documentElement;
  if (!theme) return;

  const rgb = (c) => `rgb(${c.map((n) => Math.round(n)).join(', ')})`;
  const isDark = (c) => c && (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) < 128;

  if (theme.bg) root.style.setProperty('--tb-bg', rgb(theme.bg));
  else root.style.setProperty('--tb-bg', theme.dark ? '#1f1f1f' : '#f7f8fa');

  if (theme.fg) root.style.setProperty('--tb-fg', rgb(theme.fg));
  else root.style.setProperty('--tb-fg', theme.dark ? '#e8e8e8' : '#1f2329');

  const dark = theme.bg ? isDark(theme.bg) : theme.dark;
  root.style.setProperty('--tb-icon-filter', dark ? 'invert(1)' : 'none');
  root.style.setProperty('--tb-border', dark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.08)');
  root.style.setProperty('--tb-hover', dark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.06)');
  root.style.setProperty('--tb-active', dark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)');
}

function applyWindowState({ maximized }) {
  maximizeBtn.innerHTML = maximized ? ICON_RESTORE : ICON_MAXIMIZE;
  maximizeBtn.title = maximized ? '向下还原' : '最大化';
}

api.onState(applyState);
api.onTheme(applyTheme);

// 渲染完成后向主进程取一次初始状态
api.getState().then((initial) => {
  applyState(initial);
  applyWindowState({ maximized: initial.maximized });
});
api.onWindowState(applyWindowState);
