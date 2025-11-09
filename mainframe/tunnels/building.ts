// @tunneled!

import { readRepoWenvConfig } from '@/center/wenv-config'
import { generateViteConfig } from '../servers/vite-spinner/meta-config'
import { build } from 'vite'
import chalk from 'chalk'

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
    console.log(repoName, 'Building PRE-RENDERERs')
    try {
      const result = await build(preRenderConfig)
      log(chalk.bgGreenBright('[PRE-RENDERER BUILD SUCCESSFUL'))
    } catch (e) {
      log(chalk.bgRedBright('[PRE RENDERER BUILD FAILED]'))
      throw e
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
    log(chalk.bgRedBright('[BUILD FAILED]'))
    throw e
  }

  return {
    success: true,
  }
}
