import { readdir, stat, exists } from 'fs/promises'
import { join } from 'path'
import type { Repo } from './messages'

// Assumes "main" branch and "origin" remote

export function startReposMonitor() {
  let repos: Repo[] = []

  async function refresh() {
    console.log('Refreshing repos')
    const reposPaths = await readdir('./repos')

    const outputRepos: Repo[] = []

    const mainframePath = join('./')
    outputRepos.push({
      name: null,
      status: await analyzeGitRepo(mainframePath),
    })

    for (let repo of reposPaths) {
      const repoPath = join('./repos', repo)
      const result = await analyzeRepoPath(repoPath)
      if (result === 'dir') {
        outputRepos.push({
          name: repo,
          status: ['dir'],
        })
      } else if (result === 'git') {
        const result = await analyzeGitRepo(repoPath)
        outputRepos.push({
          name: repo,
          status: result,
        })
      }
    }

    repos = outputRepos
  }

  return {
    refresh,
    get repos() {
      return repos
    },
  }
}

// Private

async function analyzeRepoPath(
  repoPath: string,
): Promise<null | 'dir' | 'git'> {
  const stats = await stat(repoPath)
  if (stats.isDirectory()) {
    // console.log(`${repoPath} is directory`)
    const gitPath = join(repoPath, '.git')
    if ((await exists(gitPath)) && (await stat(gitPath)).isDirectory()) {
      // console.log(`${repoPath} is git repo`)
      return 'git'
    } else {
      // console.log(`${repoPath} is not git repo`)
      return 'dir'
    }
  } else {
    return null
  }
}

async function analyzeGitRepo(
  repoPath: string,
): Promise<['git'] | ['git-full', remote: string]> {
  // Read origin URL from .git/config
  try {
    const url =
      await Bun.$`cd ${repoPath} && git config --get remote.origin.url`

    const remote = url.text().trim()
    // console.log('Remote', remote)

    return ['git-full', remote]
  } catch (err) {
    // console.log('Repo has no remote')
    return ['git']
  }
}
