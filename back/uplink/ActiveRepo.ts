import { readdir, stat, exists } from 'fs/promises'
import { join } from 'path'
import type { Repo, SyncStatus } from './messages'
import { mkdir } from 'fs/promises'
import trash from 'trash'
import chalk from 'chalk'
import * as git from './git'

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
    const result = await git.analyzePath(this.path)
    if (result === 'dir') {
      this.status = ['dir']
    } else if (result === 'git') {
      const result = await git.analyzeRepo(this.path)
      this.status = result
      await this.analyzeSyncStatus()
    } else {
      this.status = ['invalid']
    }
  }

  async init() {
    if (this.status[0] === 'invalid') {
      await mkdir(this.path)
      this.status = ['dir']
      await this.initGit()
    }
  }

  async initGit() {
    if (this.status[0] === 'dir') {
      await git.init(this.path)
      this.status = ['git']
    }
  }

  async trash() {
    await trash(this.path)
    this.status = ['invalid']
  }

  async addRemote(url: string) {
    if (this.status[0] === 'git') {
      const resolvedUrl = await git.addRemote(this.path, url)
      this.status = ['git-full', resolvedUrl, 'unknown']
      await git.pull(this.path)
      this.status = ['git-full', resolvedUrl, 'in-sync']
    }
  }

  async analyzeSyncStatus() {
    console.log('Analyzing sync status!')
    if (this.status[0] === 'git-full') {
      const unresolvedConflicts = await git.hasUnresolvedMergeConflicts(
        this.path,
      )
      if (unresolvedConflicts) {
        await git.abortMerge(this.path)
      }
      const lastFetchedAt = await git.lastFetchedAt(this.path)
      const fetchedSecondsAgo = (new Date().getTime() - lastFetchedAt) / 1000
      console.log('LAST FETCH MS', fetchedSecondsAgo)
      if (fetchedSecondsAgo > 60 * 1) {
        await git.fetch(this.path)
      }
      const [status, uncommittedChanges] = await git.assesSyncStatus(this.path)
      this.uncommittedChanges = uncommittedChanges
      this.status[2] = status
    }
  }

  async sync() {
    if (this.status[0] === 'git-full') {
      const syncStatus = this.status[2]
      if (this.uncommittedChanges) {
        await git.autoCommit(this.path)
      }

      if (syncStatus === 'ahead') {
        await git.push(this.path)
      } else if (syncStatus === 'behind') {
        await git.pull(this.path)
      } else if (syncStatus === 'diverged') {
        this.mergeConflicts = !(await git.attemptAutomerge(this.path))
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
