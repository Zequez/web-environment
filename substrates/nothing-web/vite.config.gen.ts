import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { imagetools } from 'vite-imagetools'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { $path } from '@/center/utils'
import addCname from '@/center/vite-tools/add-cname'
import type { ViteMetaConfig } from '@/back/servers/vite-spinner/meta-config'
import { createConfig as createUnoCSSConfig } from '../../meta.unocss.config'
import { readRepoWenvConfig } from '@/center/wenv-config'

export default ({ repo, port, accessibleFromLocalNetwork }: ViteMetaConfig) => {
  const wenv = readRepoWenvConfig(repo)
  const unocss = createUnoCSSConfig({ repo, fonts: wenv.fonts })

  return defineConfig({
    server: {
      host: accessibleFromLocalNetwork ? '0.0.0.0' : 'localhost',
      port: port,
    },
    root: __dirname,
    plugins: [
      svelte(),
      UnoCSS(unocss),
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
