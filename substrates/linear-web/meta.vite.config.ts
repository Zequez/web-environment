import { defineSubstrateViteConfig } from '@/mainframe/servers/vite-spinner/meta-config'

export default defineSubstrateViteConfig((metaConfig) => ({
  preRenderPaths: () => ['/'],
}))
