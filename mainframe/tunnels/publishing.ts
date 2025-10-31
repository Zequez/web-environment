// @tunneled

import { readRepoWenvConfig } from '@/center/wenv-config'
import { generateViteConfig } from '../servers/vite-spinner/meta-config'
import { build } from 'vite'
import chalk from 'chalk'
import { $path } from '@/center/utils/system'
import {
  forcePushToOriginOnWwwBranch,
  remoteUrl,
} from '../servers/git-server/git'

export async function buildRepo(repo: string) {
  const repoName = chalk.bgYellowBright(`[${repo}]`)
  const wenv = readRepoWenvConfig(repo)
  const log = (...args: any[]) => console.log(repoName, ...args)

  const preRenderConfig = await generateViteConfig({
    repo,
    wenv,
    mode: {
      mode: 'build-prerenderer',
    },
  })

  if (preRenderConfig) {
    console.log(repoName, 'Building PRE-RENDERER')
    try {
      await build(preRenderConfig)
      log(chalk.bgGreenBright('[PRE-RENDERER BUILD SUCCESSFUL'))
    } catch (e) {
      console.error(e)
      log(chalk.bgRedBright('[PRE RENDERER BUILD FAILED]'))
      return false
    }
  } else {
    log('Skipping PRE-Renderer build')
  }

  const buildConfig = await generateViteConfig({
    repo,
    wenv,
    mode: {
      mode: 'build',
    },
  })

  log(`BUILDING ${preRenderConfig ? ' AND PRE-RENDERING' : ''}`)
  try {
    await build(buildConfig!)
    log(chalk.bgGreenBright('[BUILD SUCCESSFUL'))
  } catch (e) {
    console.error(e)
    log(chalk.bgRedBright('[BUILD FAILED]'))
    return false
  }

  return true
}

export async function publishRepo(repo: string) {
  console.log(
    chalk.bgRedBright(
      'WARNING IF THIS FAILS THE FUNCTION STILL RETURNS NULL. UPDATE!',
    ),
  )
  const origin = await remoteUrl($path(`repos/${repo}`))
  if (origin) {
    await forcePushToOriginOnWwwBranch($path(`projections/${repo}`), origin)
  }
  return null
}
