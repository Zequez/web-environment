import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'
import { MAINFRAME_UI_PORT } from '@/center/ports'
import { createConfig as createUnoCSSConfig } from '../meta.unocss.config'

export default () =>
  defineConfig({
    server: {
      host: '0.0.0.0',
      port: MAINFRAME_UI_PORT,
    },
    root: './mainframe/ui',
    plugins: [
      svelte(),
      UnoCSS(createUnoCSSConfig({ repo: '_' })),
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
