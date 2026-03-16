const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { runSetup } = require('./ssh')

let win

function createWindow() {
  win = new BrowserWindow({
    width: 480,
    height: 620,
    resizable: false,
    autoHideMenuBar: true,
    title: 'Proxy Setup',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  win.loadFile('index.html')
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('setup', async (_, data) => {
  const send = (channel, payload) => win.webContents.send(channel, payload)
  await runSetup(data, send)
})
