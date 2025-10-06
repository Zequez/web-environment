// This file is here just for VSCode Intellisense

import { defineConfig } from 'unocss'
import generateUnoCSSConfig from './mainframe/servers/vite-spinner/generate-unocss-config'

console.log('Loading UNOCSS HERE???')

export default defineConfig(generateUnoCSSConfig({ repo: '_' }))
