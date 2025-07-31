import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

export default (repo: string, port: number) => {
  return defineConfig({
    server: {
      host: '0.0.0.0',
      port: port,
    },
    root: './substrates/editor',
    plugins: [svelte(), UnoCSS(), Icons({ compiler: 'svelte' })],
    define: {
      __REPO__: JSON.stringify(repo),
    },
    resolve: {
      alias: {
        '@@@': path.resolve(__dirname, `../../repos/${repo}`),
        '@@': path.resolve(__dirname, '../../repos/'),
        '@': path.resolve(__dirname, '../../'),
      },
    },
  })
}
