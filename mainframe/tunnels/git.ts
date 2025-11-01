// @tunneled
import fs from 'fs'
import * as git from 'isomorphic-git'
import { $path } from '@/center/utils/system'
import { type Repo } from '../servers/git-server/messages'
import { ActiveRepo } from '../servers/git-server/ActiveRepo'

export async function listRepos() {
  const result: Repo[] = []
  const reposPaths = fs.readdirSync($path('repos'))
  for (let repo of reposPaths) {
    const aRepo = await ActiveRepo.create(repo)
    if (aRepo) {
      await aRepo.analyze()
      result.push(aRepo.toJSON())
    }
  }
  return result
}

export async function getLogs(repo: string) {
  const repoPath = $path(`repos/${repo}`)
  const remoteRef = 'refs/remotes/origin/main'
  const localRef = 'refs/heads/main'
  const localCommits = await git.log({ fs, dir: repoPath, ref: localRef })

  return localCommits
}
