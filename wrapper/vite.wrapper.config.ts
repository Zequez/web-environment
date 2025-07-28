import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { WRAPPER_PORT } from '../back/ports'
import path from 'path'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: WRAPPER_PORT,
  },
  root: './wrapper',
  plugins: [svelte(), UnoCSS(), Icons({ compiler: 'svelte' })],
  resolve: {
    alias: {
      '@@': path.resolve(__dirname, '../repos'),
      '@back': path.resolve(__dirname, '../back'),
    },
  },
})
