const { contextBridge, ipcRenderer } = require('electron')

export type ElectronBridge = {
  openFolder: (path: string | null) => void
  openExternal: (url: string) => void
  openView: (repo: string | null) => void
}

contextBridge.exposeInMainWorld('electronAPI', {
  openFolder: (name: string | null) => ipcRenderer.invoke('open-folder', name),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  openView: (repo: string | null) => ipcRenderer.invoke('open-view', repo),
} satisfies ElectronBridge)

console.log('Preload loaded')

// import { contextBridge, ipcRenderer } from 'electron'
// import fs from 'fs'

// contextBridge.exposeInMainWorld('api', {
//   readFile: (filePath: string) => fs.readFileSync(filePath, 'utf-8'),
// })

// class API {
//   readFile(filePath: string) {
//     return fs.readFileSync(filePath, 'utf-8')
//   }
// }
//
// ;(window as any).api = new API()
