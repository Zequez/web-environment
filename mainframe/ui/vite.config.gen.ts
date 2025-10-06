import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'
import { MAINFRAME_UI_PORT } from '@/center/ports'
import generateUnoCSSConfig from '../servers/vite-spinner/generate-unocss-config'

export default () =>
  defineConfig({
    server: {
      host: 'localhost',
      port: MAINFRAME_UI_PORT,
    },
    root: './mainframe/ui',
    plugins: [
      svelte(),
      UnoCSS(generateUnoCSSConfig({ repo: '_' })),
      Icons({ compiler: 'svelte' }),
    ],
    resolve: {
      alias: {
        '@@': path.resolve(__dirname, '../../repos/'),
        '@': path.resolve(__dirname, '../../'),
      },
    },
    publicDir: '../../assets',
  })
