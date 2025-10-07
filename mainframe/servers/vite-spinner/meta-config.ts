import fs from 'fs'

import { defineConfig, type PluginOption } from 'vite'

// Plugins
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { imagetools } from 'vite-imagetools'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import ViteYaml from '@modyfi/vite-plugin-yaml'
import { mdsvex } from 'mdsvex'
import AutoImport from 'unplugin-auto-import/vite'
// import react from '@vitejs/plugin-react'

// Utils
import { $path } from '@/center/utils/system'
import { type WEnvConfig } from '@/center/wenv-config'
import generateUnoCSSConfig from '@/mainframe/servers/vite-spinner/generate-unocss-config'

export type ViteModeConfig =
  | {
      port: number
      accessibleFromLocalNetwork: boolean
      mode: 'run'
    }
  | { mode: 'build' }
  | { mode: 'build-prerenderer' }

type ViteMetaConfig = {
  repo: string
  wenv: WEnvConfig
  mode: ViteModeConfig
}

export type SubstrateViteConfig = {
  preRenderPaths?: () => string[]
  plugins?: PluginOption[]
}

export function defineSubstrateViteConfig(
  fun: (metaConfig: ViteMetaConfig) => SubstrateViteConfig,
) {
  return (metaConfig: ViteMetaConfig) => fun(metaConfig)
}

export type PreRender = (url: string) => { head: string; body: string }

export async function generateViteConfig(C: ViteMetaConfig) {
  const { repo, wenv, mode: M } = C
  const substrate = wenv.substrate || 'nothing-web'
  const substrateMetaConfigPath = $path(
    `substrates/${substrate}/meta.vite.config.ts`,
  )
  const substratePreRenderPath = $path(`substrates/${substrate}/prerender.ts`)
  const substrateHasPreRendering = fs.existsSync(substratePreRenderPath)

  if (M.mode === 'build-prerenderer' && !substrateHasPreRendering) {
    return null
  }

  if (!fs.existsSync($path(`substrates/${substrate}`))) {
    throw new Error(`No such substrate: ${substrate}`)
  }

  const substrateConfig: SubstrateViteConfig = fs.existsSync(
    substrateMetaConfigPath,
  )
    ? (
        (await import(
          $path(`substrates/${substrate}/meta.vite.config.ts`)
        )) as { default: (C: ViteMetaConfig) => SubstrateViteConfig }
      ).default(C)
    : {}

  // Auto-imports
  const repoImportPath = $path(`repos/${repo}/auto-import.ts`)
  let autoImportConfig: ReturnType<typeof AutoImport> | undefined = undefined
  if (fs.existsSync(repoImportPath)) {
    console.log(`AUTO IMPORTING ${repo}`)
    autoImportConfig = (await import(repoImportPath)).default
  }
  console.log(autoImportConfig)
  // autoImportConfig = AutoImport({
  //   // imports: [ { name: '*', as: '_', from: 'lodash' }],
  // })

  return defineConfig({
    root: $path(`substrates/${substrate}`),
    define: {
      __REPO__: JSON.stringify(repo),
    },
    publicDir: $path('assets'),
    resolve: {
      alias: {
        '@@@': $path(`repos/${repo}`),
        '@@': $path('repos'),
        '@': $path(''),
      },
    },
    cacheDir: `node_modules/.vite-${repo}`,

    // ███╗   ███╗ ██████╗ ██████╗ ███████╗███████╗
    // ████╗ ████║██╔═══██╗██╔══██╗██╔════╝██╔════╝
    // ██╔████╔██║██║   ██║██║  ██║█████╗  ███████╗
    // ██║╚██╔╝██║██║   ██║██║  ██║██╔══╝  ╚════██║
    // ██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗███████║
    // ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝

    server:
      M.mode === 'run'
        ? {
            host: M.accessibleFromLocalNetwork ? '0.0.0.0' : 'localhost',
            port: M.port,
          }
        : undefined,

    build:
      M.mode === 'build'
        ? {
            outDir: $path(`projections/${C.repo}`),
            emptyOutDir: true,
          }
        : M.mode === 'build-prerenderer'
          ? {
              outDir: $path(`prerenderers/${C.repo}`),
              emptyOutDir: true,
              ssr: true,
              rollupOptions: {
                input: $path(`substrates/${substrate}/prerender.ts`),
              },
            }
          : undefined,

    // ██████╗ ██╗     ██╗   ██╗ ██████╗ ██╗███╗   ██╗███████╗
    // ██╔══██╗██║     ██║   ██║██╔════╝ ██║████╗  ██║██╔════╝
    // ██████╔╝██║     ██║   ██║██║  ███╗██║██╔██╗ ██║███████╗
    // ██╔═══╝ ██║     ██║   ██║██║   ██║██║██║╚██╗██║╚════██║
    // ██║     ███████╗╚██████╔╝╚██████╔╝██║██║ ╚████║███████║
    // ╚═╝     ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝

    plugins: [
      // Public Web Plugin
      autoImportConfig,
      svelte({
        extensions: ['.svelte', '.svx'],
        // @ts-ignore
        preprocess: [mdsvex({ extensions: ['.svx'] })],
      }),
      // react(),
      UnoCSS(generateUnoCSSConfig({ repo: C.repo, fonts: wenv.fonts })),
      Icons({ compiler: 'svelte' }),
      imagetools(),
      ViteYaml(),

      ...(substrateConfig.plugins || []),

      // Local Plugins

      {
        name: 'add-cname',
        closeBundle() {
          const dest = $path(`projections/${C.repo}/CNAME`)
          if (wenv.cname) {
            fs.writeFileSync(dest, wenv.cname)
          } else {
            const src = $path(`repos/${C.repo}/CNAME`)
            if (fs.existsSync(src)) {
              fs.copyFileSync(src, dest)
            } else {
              console.warn(`⚠️ No CNAME resolved`)
            }
          }
        },
      },

      {
        name: 'prerender',
        apply: 'build',
        async writeBundle() {
          if (M.mode !== 'build' || !substrateHasPreRendering) return

          const $PP = (p: string) => $path(`projections/${repo}/${p}`)

          let template: string
          if (fs.existsSync($PP(`_index.html`))) {
            template = fs.readFileSync($PP(`_index.html`), 'utf-8')
          } else {
            template = fs.readFileSync($PP(`index.html`), 'utf-8')
            fs.copyFileSync($PP(`index.html`), $PP(`_index.html`))
          }

          const { default: render } = (await import(
            $path(`prerenderers/${repo}/prerender.js`)
          )) as { default: PreRender }

          const paths = substrateConfig.preRenderPaths?.() || ['/']
          paths.forEach((renderPath) => {
            const { head, body } = render(renderPath)

            const dest = renderPath.replace(/\/$/, '').replace(/^\//, '')
            fs.mkdirSync($path(`projections/${repo}/${dest}`), {
              recursive: true,
            })

            const final = template
              .replace('<!--app-head-->', head)
              .replace('<!--app-html-->', body)

            fs.writeFileSync(
              $path(`projections/${repo}/${dest}/index.html`),
              final,
              'utf-8',
            )
          })

          console.log(`PRE RENDERED DONE`)
        },
      },
    ],
  })
}
