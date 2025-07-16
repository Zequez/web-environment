import { readdir, stat, exists } from 'fs/promises'
import { join } from 'path'
import type { Repo, SyncStatus } from './messages'
import { mkdir } from 'fs/promises'
import trash from 'trash'
import chalk from 'chalk'

export class ActiveRepo implements Repo {
  name: string | null
  status: Repo['status'] = ['unknown']
  path: string
  uncommittedChanges: boolean = false
  mergeConflicts: boolean = false

  constructor(name: string | null) {
    const safeName = name ? name.replace(/[^a-z0-9\-_]/gi, '') : null
    this.name = safeName
    this.path = name ? join('./repos', name) : join('./')
  }

  async analyze() {
    console.log(chalk.green('ANALYZING'), this.name)
    const result = await analyzeRepoPath(this.path)
    if (result === 'dir') {
      this.status = ['dir']
    } else if (result === 'git') {
      const result = await analyzeGitRepo(this.path)
      this.status = result
      await this.analyzeSyncStatus()
    } else {
      this.status = ['invalid']
    }
  }

  async init() {
    await mkdir(this.path)
    await Bun.$`cd ${this.path} && git init`
    this.status = ['git']
  }

  async initGit() {
    if (this.status[0] === 'dir') {
      await Bun.$`cd ${this.path} && git init`
      this.status = ['git']
    }
  }

  async trash() {
    await trash(this.path)
    this.status = ['unknown']
  }

  async addRemote(url: string) {
    if (this.status[0] === 'git') {
      let resolvedUrl = url
      if (url.startsWith('https://github.com/')) {
        if (!url.endsWith('.git')) {
          resolvedUrl = `${url}.git`
        }
      }
      await Bun.$`cd ${this.path} && git remote add origin ${resolvedUrl}`
      this.status = ['git-full', resolvedUrl, 'unknown']
      await this.pull()
    }
  }

  async pull() {
    if (this.status[0] === 'git-full') {
      await Bun.$`cd ${this.path} && git pull origin main`
      this.status[2] = 'in-sync'
    }
  }

  async analyzeSyncStatus() {
    console.log('Analyzing sync status!')
    if (this.status[0] === 'git-full') {
      const unresolvedConflicts = await hasUnresolvedMergeConflicts(this.path)
      if (unresolvedConflicts) {
        await abortMerge(this.path)
      }
      const fetchHeadStat = await stat(join(this.path, '.git/FETCH_HEAD'))
      const fetchedSecondsAgo =
        (new Date().getTime() - fetchHeadStat.mtimeMs) / 1000
      console.log('LAST FETCH MS', fetchedSecondsAgo)
      if (fetchedSecondsAgo > 60 * 1) {
        await Bun.$`cd ${this.path} && git fetch`
      }
      const changes = await Bun.$`cd ${this.path} && git status --short`
      this.uncommittedChanges = !(changes.text().trim() === '')
      const zeroLocalCommits = await zeroCommits(this.path, 'local')
      const zeroRemoteCommits = await zeroCommits(this.path, 'remote')
      if (zeroLocalCommits && zeroRemoteCommits) {
        this.status[2] = this.uncommittedChanges ? 'ahead' : 'in-sync'
      } else if (zeroLocalCommits) {
        this.status[2] = this.uncommittedChanges ? 'diverged' : 'behind'
      } else if (zeroRemoteCommits) {
        this.status[2] = 'ahead'
      } else {
        const status =
          await Bun.$`cd ${this.path} && git rev-list --left-right --count HEAD...origin/main`
        const parsedStatus = status.text().trim().split(/\s+/)
        console.log('STATUS', parsedStatus)
        const [ahead, behind] = parsedStatus.map((v) => parseInt(v, 10))
        if (behind && ahead) {
          this.status[2] = 'diverged'
        } else if (behind) {
          this.status[2] = this.uncommittedChanges ? 'diverged' : 'behind'
        } else if (ahead) {
          this.status[2] = 'ahead'
        } else {
          this.status[2] = this.uncommittedChanges ? 'ahead' : 'in-sync'
        }
      }
    }
  }

  async sync() {
    if (this.status[0] === 'git-full') {
      const syncStatus = this.status[2]
      if (this.uncommittedChanges) {
        await Bun.$`cd ${this.path} && git add -A && git commit -m "Auto-commit ${new Date().toISOString()}" && git push`
      }

      if (syncStatus === 'ahead') {
        await Bun.$`cd ${this.path} && git push --set-upstream origin main`
      } else if (syncStatus === 'behind') {
        await Bun.$`cd ${this.path} && git pull origin main`
      } else if (syncStatus === 'diverged') {
        try {
          await Bun.$`cd ${this.path} && git merge --no-edit origin/main`
          this.mergeConflicts = false
        } catch (e) {
          await abortMerge(this.path)
          this.mergeConflicts = true
        }
      }

      await this.analyzeSyncStatus()
    }
  }

  toJSON(): Repo {
    return {
      name: this.name,
      status: this.status,
      mergeConflicts: this.mergeConflicts,
    }
  }
}

async function abortMerge(repoPath: string) {
  return await Bun.$`cd ${repoPath} && git merge --abort`
}

async function hasUnresolvedMergeConflicts(repoPath: string) {
  const output = await Bun.$`cd ${repoPath} && git ls-files -u`
  console.log('REPO PATH MERGE UNRESOLVED', repoPath, output.text())
  return output.text().trim() !== ''
}

async function zeroCommits(repoPath: string, target: 'remote' | 'local') {
  const tragetRef =
    target === 'remote' ? 'refs/remotes/origin/main' : 'refs/heads/main'
  try {
    await Bun.$`cd ${repoPath} && git show-ref --verify --quiet ${tragetRef}`
    return false
  } catch (e) {
    return true
  }
}

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
): Promise<['git'] | ['git-full', remote: string, sync: SyncStatus]> {
  // Read origin URL from .git/config
  try {
    const url =
      await Bun.$`cd ${repoPath} && git config --get remote.origin.url`

    const remote = url.text().trim()
    // console.log('Remote', remote)

    return ['git-full', remote, 'unknown']
  } catch (err) {
    // console.log('Repo has no remote')
    return ['git']
  }
}
