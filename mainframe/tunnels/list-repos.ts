// @tunneled

import fs from 'node:fs/promises'
import { $path } from '@/center/utils/system'
import { startReposMonitor } from '../servers/git-server/reposMonitor'
import { type Repo } from '../servers/git-server/messages'
import { ActiveRepo } from '../servers/git-server/ActiveRepo'

export default async function listRepos() {
  const result: Repo[] = []
  const reposPaths = await fs.readdir($path('repos'))
  for (let repo of reposPaths) {
    const aRepo = await ActiveRepo.create(repo)
    if (aRepo) {
      await aRepo.analyze()
      result.push(aRepo.toJSON())
    }
  }
  return result
}

export async function streamListRepos(cb: (repos: Repo[]) => void) {
  const reposMonitor = startReposMonitor()
  await reposMonitor.refresh()
  const clean = reposMonitor.subscribe(cb)

  const interval = setInterval(() => {
    reposMonitor.refresh()
  }, 4000)

  return () => {
    clean()
    clearInterval(interval)
  }

  // fn(reposMonitor.repos)

  // const interval = setInterval(async () => {
  //   fn(await listRepos())
  // }, 10000)

  // return () => {
  //   clearInterval(interval)
  // }
}
