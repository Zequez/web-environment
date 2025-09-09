import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { imagetools } from 'vite-imagetools'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { $path } from '@/center/utils'
import addCname from '@/center/vite-tools/add-cname'

export default (repo: string, port?: number) => {
  return defineConfig({
    server: port
      ? {
          host: '0.0.0.0',
          port: port,
        }
      : undefined,
    root: __dirname,
    plugins: [
      svelte(),
      UnoCSS(),
      Icons({ compiler: 'svelte' }),
      addCname(repo),
      imagetools(),
    ],
    define: {
      __REPO__: JSON.stringify(repo),
    },
    build: {
      outDir: $path(`projections/${repo}`),
      emptyOutDir: true,
    },
    publicDir: $path('assets'),
    resolve: {
      alias: {
        '@@@': $path(`repos/${repo}`),
        '@@': $path('repos'),
        '@': $path(''),
      },
    },
  })
}
