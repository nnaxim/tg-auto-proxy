const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { runSetup, getResult } = require('./ssh')

let win

function createWindow() {
  win = new BrowserWindow({
    width: 700,
    height: 700,
    resizable: false,
    icon: path.join(__dirname, '../build/icon.png'),
    autoHideMenuBar: true,
    title: 'Proxy Manager',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: false,
      nodeIntegration: true,
    },
  })

  win.loadFile(path.join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('setup', async (_, data) => {
  const send = (channel, payload) => win.webContents.send(channel, payload)
  await runSetup(data, send)
})

ipcMain.handle('get-result', () => getResult())
