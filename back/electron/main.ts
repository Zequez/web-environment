import { app, BrowserWindow, nativeImage, ipcMain, shell } from 'electron'
import contextMenu from 'electron-context-menu'
import { fileURLToPath } from 'url'
import waitPort from 'wait-port'
import path from 'path'

import { UI_REPOS_PORT, SERVER_VITE_SPINNER_PORT } from '@/center/ports'
import { APP_NAME } from './config'

contextMenu({
  showSaveImageAs: true,
})

const VITE_DEV_SERVER_URL = 'http://localhost:' + UI_REPOS_PORT

console.log('VITE_DEV_SERVER_URL', VITE_DEV_SERVER_URL)

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

ipcMain.handle('open-view', async (event: any, repo: string | null) => {
  const win = new BrowserWindow({
    width: 1500,
    height: 1000,
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
  const result = await fetch(
    `http://localhost:${SERVER_VITE_SPINNER_PORT}/${repo}`,
  )
  const url = await result.text()
  win.loadURL(url + 'editor.html')
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // optional
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // ✅ allows <webview> tag
    },
    icon: './assets/favicon.png',
  })
  // // The Web Substrate has no production version
  // console.log(process.env.VITE_DEV_SERVER_URL)
  waitPort({ host: 'localhost', port: UI_REPOS_PORT, output: 'silent' }).then(
    () => {
      win.loadURL(VITE_DEV_SERVER_URL)
    },
  )
}

app.setName(APP_NAME)
app.disableHardwareAcceleration()
app
  .whenReady()
  .then(() => {
    const image = nativeImage.createFromPath('./assets/dock-icon.png')
    // On OSX
    if (app.dock) {
      app.dock.setIcon(image)
      app.dock.setBadge(APP_NAME)
    }
  })
  .then(createWindow)
