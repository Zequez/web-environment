import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { imagetools } from 'vite-imagetools'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { $path } from '@/center/utils/system'
import addCname from '@/center/vite-tools/add-cname'
import type { ViteMetaConfig } from '@/mainframe/servers/vite-spinner/meta-config'
import { createConfig as createUnoCSSConfig } from '@/mainframe/meta.unocss.config'
import { readRepoWenvConfig } from '@/center/wenv-config'

export default (C: ViteMetaConfig) => {
  const wenv = readRepoWenvConfig(C.repo)
  const unocss = createUnoCSSConfig({ repo: C.repo, fonts: wenv.fonts })

  return defineConfig({
    server:
      C.mode === 'run'
        ? {
            host: C.accessibleFromLocalNetwork ? '0.0.0.0' : 'localhost',
            port: C.port,
          }
        : undefined,
    root: __dirname,
    plugins: [
      svelte(),
      UnoCSS(unocss),
      Icons({ compiler: 'svelte' }),
      addCname(C.repo),
      imagetools(),
    ],
    define: {
      __REPO__: JSON.stringify(C.repo),
    },
    build: {
      outDir: $path(`projections/${C.repo}`),
      emptyOutDir: true,
    },
    publicDir: $path('assets'),
    resolve: {
      alias: {
        '@@@': $path(`repos/${C.repo}`),
        '@@': $path('repos'),
        '@': $path(''),
      },
    },
  })
}
