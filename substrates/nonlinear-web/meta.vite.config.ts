import { defineSubstrateViteConfig } from '@/mainframe/servers/vite-spinner/meta-config'
import { preact } from '@preact/preset-vite'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'

export default defineSubstrateViteConfig((metaConfig) => ({
  preRenderPaths: () => ['/'],
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        jsxImportSource: 'preact',
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
      }),
    },
    preact(),
  ],
}))
