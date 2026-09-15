'use strict';
// 标题栏窗口的 preload:仅暴露必要的窗口控制 IPC

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('harnessShell', {
  minimize: () => ipcRenderer.send('shell:minimize'),
  toggleMaximize: () => ipcRenderer.send('shell:toggle-maximize'),
  close: () => ipcRenderer.send('shell:close'),
  restartHarness: () => ipcRenderer.send('shell:restart-harness'),
  reloadApp: () => ipcRenderer.send('shell:reload-app'),
  getState: () => ipcRenderer.invoke('shell:get-state'),
  onState: (callback) => ipcRenderer.on('shell:state', (_event, payload) => callback(payload)),
  onTheme: (callback) => ipcRenderer.on('shell:theme', (_event, payload) => callback(payload)),
  onWindowState: (callback) => ipcRenderer.on('shell:window-state', (_event, payload) => callback(payload)),
});
