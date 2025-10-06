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
    run: await generateViteConfig({
      repo,
      wenv,
      mode: {
        mode: 'run',
        port: runModeConfig.port,
        accessibleFromLocalNetwork: runModeConfig.accessibleFromLocalNetwork,
      },
    }),
    build: await generateViteConfig({
      repo,
      wenv,
      mode: {
        mode: 'build',
      },
    }),
    buildPrerenderer: await generateViteConfig({
      repo,
      wenv,
      mode: {
        mode: 'build-prerenderer',
      },
    }),
  }

  async function devRun() {
    const server = await createServer(configs.run!)
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
    if (configs.buildPrerenderer) {
      await build(configs.buildPrerenderer)
      console.log('PRE-Renderer built')
    } else {
      console.log('Skipping PRE-Renderer build')
    }

    await build(configs.build!)
    console.log('REPO BUILT!')
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
