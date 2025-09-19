import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { imagetools } from 'vite-imagetools'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { $path } from '@/center/utils/system'
import path from 'path'
import addCname from '@/center/vite-tools/add-cname'
import { readRepoWenvConfig } from '@/center/wenv-config'
import { createConfig as createUnoCSSConfig } from '@/mainframe/meta.unocss.config'
import type { ViteMetaConfig } from '@/mainframe/servers/vite-spinner/meta-config'
import fs from 'fs'

import { type default as prerenderType } from './prerender.ts'

export default (C: ViteMetaConfig) => {
  const wenv = readRepoWenvConfig(C.repo)
  console.log('CREATING LINEAR VITE CONFIG', wenv)
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
      imagetools(),
      addCname(C.repo),
      // vitePrerenderPlugin({
      //   renderTarget: '#root',
      //   prerenderScript: path.join(__dirname, 'prerender.ts'),
      // }),
      {
        name: 'prerender',
        apply: 'build',
        async writeBundle() {
          if (C.mode !== 'build') {
            return
          }
          // Load the SSR version of the component
          // So ensure you either ran vite build --ssr or
          // import via an SSR built output

          const { default: render } = (await import(
            $path(`prerenderers/${C.repo}/prerender.js`)
          )) as { default: typeof prerenderType }
          const { head, body } = render('/')

          const template = fs.readFileSync(
            $path(`projections/${C.repo}/index.html`),
            'utf-8',
          )
          const final = template
            .replace('<!--app-head-->', head)
            .replace('<!--app-html-->', body)

          fs.writeFileSync(
            $path(`projections/${C.repo}/index.html`),
            final,
            'utf-8',
          )
          console.log(`PRE RENDERED DONE`)
        },
      },
    ],
    define: {
      __REPO__: JSON.stringify(C.repo),
    },
    build:
      C.mode === 'build'
        ? {
            outDir: $path(`projections/${C.repo}`),
            emptyOutDir: true,
          }
        : C.mode === 'build-prerenderer'
          ? {
              outDir: $path(`prerenderers/${C.repo}`),
              emptyOutDir: true,
              ssr: true,
              rollupOptions: {
                input: path.join(__dirname, 'prerender.ts'),
              },
            }
          : undefined,
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
