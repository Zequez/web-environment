import { $path } from '@/center/utils/system'
import { defineSubstrateViteConfig } from '@/mainframe/servers/vite-spinner/meta-config'
import { readdirSync, existsSync } from 'fs'

export default defineSubstrateViteConfig((metaConfig) => {
  return {
    preRenderPaths: () => {
      const pagesPath = $path(`repos/${metaConfig.repo}/pages`)
      let pages = ['/']
      if (existsSync(pagesPath)) {
        readdirSync(pagesPath).forEach((file) => {
          if (file.endsWith('.svelte')) {
            const pageName = file.replace(/\.svelte$/, '')
            if (pageName !== 'index') {
              pages.push(`/${pageName}`)
            }
          }
        })
      }
      return pages
    },
  }
})
