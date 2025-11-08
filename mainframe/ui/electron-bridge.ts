import type { ElectronBridge } from '../electron/preload'

export function openInBrowser(url: string) {
  const electronAPI = (window as any).electronAPI as ElectronBridge
  electronAPI.openExternal(url)
}

export function openOnFileExplorer(name: string | null) {
  console.log('NAME', name)
  const electronAPI = (window as any).electronAPI as ElectronBridge
  electronAPI.openFolder(name)
}
