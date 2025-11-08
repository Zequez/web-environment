import type { ElectronBridge } from '../electron/preload'

export function openInBrowser(url: string) {
  const electronAPI = (window as any).electronAPI as ElectronBridge
  electronAPI.openExternal(url)
}
