import { app, BrowserWindow, nativeImage, ipcMain, shell } from 'electron'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

ipcMain.handle('open-folder', async (event: any, name: any) => {
  const sanitized = name ? name.replace(/[^a-z0-9\-_]/gi, '') : ''
  console.log('NAME', name)
  console.log('SANITIZED', sanitized)
  const result = path.join(
    __dirname,
    '../../../',
    sanitized ? `repos/${sanitized}` : '',
  )
  console.log('RESULT', result)
  await shell.openPath(result)
})

ipcMain.handle('open-external', async (event: any, url: any) => {
  await shell.openExternal(url)
})

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // optional
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // ✅ allows <webview> tag
    },
    icon: './front/public/favicon.png',
  })
  // // The Web Substrate has no production version
  // console.log(process.env.VITE_DEV_SERVER_URL)
  win.loadURL(process.env.VITE_DEV_SERVER_URL!)
}

app.setName('Web Substrate')
app.disableHardwareAcceleration()
app
  .whenReady()
  .then(() => {
    const image = nativeImage.createFromPath('./front/public/dock-icon.png')
    // On OSX
    if (app.dock) {
      app.dock.setIcon(image)
      app.dock.setBadge('Web Substrate')
    }
  })
  .then(createWindow)
