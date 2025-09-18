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
      {
        enforce: 'pre',
        ...mdx({
          jsxImportSource: 'preact',
          remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
        }),
      },
      preact(),
      addCname(repo),
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
