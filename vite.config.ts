import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import AutoImport from 'unplugin-auto-import/vite'
import { type Plugin } from 'vite'
import path, { basename, extname, join } from 'path'
import { LAND_ROOT, DIST_ROOT } from './back/paths'
import { mkdir, readFile, writeFile, exists } from 'fs/promises'
import { createHash } from 'crypto'

function skipHMRPlugin(): Plugin {
  return {
    name: 'vite-plugin-skip-hmr',

    handleHotUpdate({ file, server }) {
      // Customize your condition here
      if (file.endsWith('.meta.json')) {
        console.log(`[skip-hmr] Skipping HMR for: ${file}`)

        // Return empty list to skip HMR
        return []
      }

      // Returning nothing lets Vite continue normally
    },
  }
}

export async function generateConfig({
  landRoot,
  build,
}: {
  landRoot: string
  build: boolean
}) {
  const landConfig = landRoot
    ? await import(path.join(LAND_ROOT, landRoot, 'config.json'))
    : null
  const title =
    landRoot && landConfig?.title ? landConfig.title : 'Web Substrate'
  const defaultFavicon = path.join(process.cwd(), 'front/public/favicon.png')
  const landFavicon = path.join(LAND_ROOT, landRoot, 'favicon.png')
  const faviconPath = (await exists(landFavicon)) ? landFavicon : defaultFavicon

  const faviconName =
    landRoot && build
      ? await hashAndCopyFavicon(
          faviconPath,
          path.join(DIST_ROOT, landRoot, 'assets'),
        )
      : null

  function htmlTransformPlugin(): Plugin {
    return {
      name: 'html-transform',
      transformIndexHtml(html) {
        return html
          .replace('<%= TITLE %>', title)
          .replace(
            '<%= FAVICON_PATH %>',
            faviconName ? `/assets/${faviconName}` : '/public/favicon.png',
          )
      },
    }
  }

  return defineConfig({
    server: {
      host: '0.0.0.0',
      port: 2332,
    },
    root: './front',
    plugins: [
      AutoImport({}),
      skipHMRPlugin(),
      svelte(),
      UnoCSS(),
      Icons({ compiler: 'svelte' }),
      htmlTransformPlugin(),
    ],
    define: {
      LAND_ROOT: JSON.stringify(landRoot),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './front'),
        '@@': path.resolve(__dirname, './land'),
        '@back': path.resolve(__dirname, './back'),
      },
    },
    build: {
      outDir: `../www/${landRoot}`,
      rollupOptions: {
        input: './front/index.html',
      },
    },
    publicDir: './front/public',
  })
}

export async function hashAndCopyFavicon(
  inputPath: string,
  outputDir: string,
): Promise<string> {
  const buffer = await readFile(inputPath)
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 8)

  const base = basename(inputPath, extname(inputPath))
  const ext = extname(inputPath)
  const outputName = `${base}-${hash}${ext}`
  const outputPath = join(outputDir, outputName)

  await mkdir(outputDir, { recursive: true })
  await writeFile(outputPath, buffer)

  return outputName
}

export default await generateConfig({ landRoot: '', build: false })
