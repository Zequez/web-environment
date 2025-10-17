import { build, createServer, type ViteDevServer } from 'vite'

import { readRepoWenvConfig } from '@/center/wenv-config'

import { generateViteConfig } from './meta-config'
import { forcePushToOriginOnWwwBranch, remoteUrl } from '../git-server/git'
import { $path } from '@/center/utils/system'

export default async function repoVite(
  repo: string,
  runModeConfig: { port: number; accessibleFromLocalNetwork: boolean },
) {
  const wenv = readRepoWenvConfig(repo)

  const configs = {
    run: () =>
      generateViteConfig({
        repo,
        wenv,
        mode: {
          mode: 'run',
          port: runModeConfig.port,
          accessibleFromLocalNetwork: runModeConfig.accessibleFromLocalNetwork,
        },
      }),
    build: () =>
      generateViteConfig({
        repo,
        wenv,
        mode: {
          mode: 'build',
        },
      }),
    buildPrerenderer: () =>
      generateViteConfig({
        repo,
        wenv,
        mode: {
          mode: 'build-prerenderer',
        },
      }),
  }

  async function devRun() {
    const runConfig = await configs.run()
    const server = await createServer(runConfig!)
    console.log('CREATING DEV SERVER')
    // server.middlewares.use('/__uplink', (req, res, next) => {
    //   console.log('REQUEST!', req.url)

    //   res.statusCode = 200
    //   res.setHeader('Content-Type', 'text/plain')
    //   res.end('Hey')
    // })
    await server.listen()

    return server
  }

  async function buildProjection() {
    const buildPrerendererConfig = await configs.buildPrerenderer()
    if (buildPrerendererConfig) {
      try {
        await build(buildPrerendererConfig)
        console.log('PRE-Renderer built')
      } catch (e) {
        console.error(e)
        console.log('PRE-Renderer built failed')
        return
      }
    } else {
      console.log('Skipping PRE-Renderer build')
    }

    const buildConfig = await configs.build()
    try {
      await build(buildConfig!)
      console.log('REPO BUILT!')
    } catch (e) {
      console.error(e)
      console.log('REPO BUILD FAILED')
    }
  }

  async function publishProjection() {
    const origin = await remoteUrl($path(`repos/${repo}`))
    if (origin) {
      await forcePushToOriginOnWwwBranch($path(`projections/${repo}`), origin)
    }
  }

  return {
    devRun,
    buildProjection,
    publishProjection,
  }
}
