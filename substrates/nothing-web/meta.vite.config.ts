import { $path } from '@/center/utils/system'
import { defineSubstrateViteConfig } from '@/mainframe/servers/vite-spinner/meta-config'
import { readdirSync, existsSync } from 'fs'

export default defineSubstrateViteConfig((metaConfig) => {
  const pagesPath = $path(`repos/${metaConfig.repo}/pages`)
  let pages = ['/']
  if (existsSync(pagesPath)) {
    readdirSync(pagesPath).forEach((file) => {
      console.log(file)
    })
  }
  return {
    preRenderPaths: () => pages,
  }
})
