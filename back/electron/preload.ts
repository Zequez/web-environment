const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  openFolder: (path: string) => ipcRenderer.invoke('open-folder', path),
})

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
