import { defineConfig } from 'vite'
import fs from 'fs'
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { preact } from '@preact/preset-vite'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { $path } from '@/center/utils'

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
      {
        enforce: 'pre',
        ...mdx({
          jsxImportSource: 'preact',
          remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
        }),
      },
      preact(),
      {
        name: 'copy-cname',
        closeBundle() {
          const src = $path(`repos/${repo}/CNAME`)
          const dest = $path(`projections/${repo}/CNAME`)
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest)
            console.log(`✅ Copied CNAME to ${dest}`)
          } else {
            console.warn(`⚠️ No CNAME file found at ${src}`)
          }
        },
      },
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
