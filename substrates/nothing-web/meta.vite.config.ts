import { $path } from '@/center/utils/system'
import { defineSubstrateViteConfig } from '@/mainframe/servers/vite-spinner/meta-config'
import { readdirSync, existsSync } from 'fs'

export default defineSubstrateViteConfig((metaConfig) => {
  return {
    preRenderPaths: () => {
      const pagesPath = $path(`repos/${metaConfig.repo}/pages`)
      let pages = ['/']
      console.log('HEY!')
      if (existsSync(pagesPath)) {
        readdirSync(pagesPath).forEach((file) => {
          console.log(file)
          const pageName = file.replace(/\.svelte$/, '')
          if (pageName !== 'index') {
            pages.push(`/${pageName}`)
          }
        })
      }
      return pages
    },
  }
})
