const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  setup: (data) => ipcRenderer.invoke('setup', data),
  onLog: (cb) => ipcRenderer.on('log', (_, msg) => cb(msg)),
  onProgress: (cb) => ipcRenderer.on('progress', (_, val) => cb(val)),
  onStatus: (cb) => ipcRenderer.on('status', (_, data) => cb(data)),
})
