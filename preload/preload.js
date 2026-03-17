const { ipcRenderer } = require('electron')
const net = require('net')

window.__setupState = {
  logs: '',
  statusText: 'Ожидание...',
  statusState: '',
  running: false,
  ip: '',
  login: '',
  pass: '',
}

window.api = {
  setup: (data) => ipcRenderer.invoke('setup', data),
  getResult: () => ipcRenderer.invoke('get-result'),

  onLog: (cb) => {
    ipcRenderer.removeAllListeners('log')
    ipcRenderer.on('log', (_, msg) => {
      window.__setupState.logs += msg + '\n'
      cb(msg)
    })
  },
  onProgress: (cb) => {
    ipcRenderer.removeAllListeners('progress')
    ipcRenderer.on('progress', (_, val) => cb(val))
  },
  onStatus: (cb) => {
    ipcRenderer.removeAllListeners('status')
    ipcRenderer.on('status', (_, data) => {
      window.__setupState.statusText = data.text
      window.__setupState.statusState = data.ok === true ? 'ok' : data.ok === false ? 'error' : 'pending'
      if (data.ok === true || data.ok === false) {
        window.__setupState.running = false
      }
      cb(data)
    })
  },

  checkPort: (ip, port) => new Promise((resolve) => {
    const socket = new net.Socket()
    socket.setTimeout(2000)
    socket.connect(port, ip, () => { socket.destroy(); resolve(true) })
    socket.on('error', () => resolve(false))
    socket.on('timeout', () => resolve(false))
  })
}
