import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { preact } from '@preact/preset-vite'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { $path } from '@/center/utils/system'
import { readRepoWenvConfig } from '@/center/wenv-config'
import addCname from '@/center/vite-tools/add-cname'
import { createConfig as createUnoCSSConfig } from '@/mainframe/meta.unocss.config'
import type { ViteMetaConfig } from '@/mainframe/servers/vite-spinner/meta-config'

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
      {
        enforce: 'pre',
        ...mdx({
          jsxImportSource: 'preact',
          remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
        }),
      },
      preact(),
      addCname(C.repo),
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
