import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'
import { UI_REPOS_PORT } from '@/center/ports'

export default () =>
  defineConfig({
    server: {
      host: '0.0.0.0',
      port: UI_REPOS_PORT,
    },
    root: './substrates/repos',
    plugins: [svelte(), UnoCSS(), Icons({ compiler: 'svelte' })],
    resolve: {
      alias: {
        '@@': path.resolve(__dirname, '../../repos/'),
        '@': path.resolve(__dirname, '../../'),
      },
    },
    publicDir: './assets',
  })
