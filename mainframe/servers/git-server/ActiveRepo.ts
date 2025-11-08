import { readdir, stat, exists } from 'fs/promises'
import { join } from 'path'
import type { Repo, SyncStatus } from './messages'
import { mkdir, cp, rename } from 'fs/promises'
import path from 'path'
import trash from 'trash'
import chalk from 'chalk'
import * as git from './git'
import { readRepoWenvConfig, type WEnvConfig } from '@/center/wenv-config'

function sanitizeRepoName(name: string) {
  return name.replace(/[^a-z0-9\-_\.]/gi, '')
}

export class ActiveRepo implements Repo {
  name: string | null
  _status: Repo['status'] = ['unknown']
  _fetching: boolean = false
  lastFetchedAt: number = 0
  path: string
  uncommittedChanges: string = ''
  mergeConflicts: boolean = false
  wenv: WEnvConfig | undefined = undefined

  constructor(name: string | null) {
    const safeName = name ? sanitizeRepoName(name) : null
    this.name = safeName
    this.path = name ? join('./repos', name) : join('./')
  }

  get status() {
    return this._status
  }

  setStatus(...status: Repo['status']) {
    this._status = status
    ActiveRepo.statusChangeNotify()
  }

  get fetching() {
    return this._fetching
  }

  setFetching(fetching: boolean) {
    this._fetching = fetching
    ActiveRepo.statusChangeNotify()
  }

  setSyncStatus(syncStatus: SyncStatus) {
    if (this.status[0] === 'git-full') {
      this.setStatus(this.status[0], this.status[1], syncStatus)
    }
  }

  static statusChangeNotify = () => {}

  static setStatusChangeNotify(cb: () => void) {
    ActiveRepo.statusChangeNotify = cb
  }

  static async create(name: string) {
    const repo = new ActiveRepo(name)
    if (await git.ensurePathIsRepo(repo.path)) {
      return repo
    } else {
      return null
    }
  }

  async analyze() {
    console.log(chalk.green('ANALYZING'), this.name)

    if (this.status[0] === 'unknown') {
      if (!(await git.isGitRepo(this.path))) {
        if (!(await git.ensurePathIsRepo(this.path))) {
          throw 'ActiveRepo could not be initialized'
        }
      }
    }

    const remoteUrl = await git.remoteUrl(this.path)

    await this.analyzeLocal()

    if (remoteUrl) {
      this.setStatus('git-full', remoteUrl, 'unknown')
      await this.analyzeSyncStatus()
    } else {
      this.setStatus('git')
    }

    // console.log(chalk.green('ANALYZING'), this.name)
    // const result = await git.analyzePath(this.path)
    // if (result === 'dir') {
    //   this.status = ['dir']
    // } else if (result === 'git') {
    //   const result = await git.remoteUrl(this.path)
    //   this.status = result
    //   await this.analyzeSyncStatus()
    // } else {
    //   this.status = ['invalid']
    // }
  }

  async analyzeSyncStatus() {
    if (this.status[0] === 'git-full') {
      const unresolvedConflicts = await git.hasUnresolvedMergeConflicts(
        this.path,
      )
      if (unresolvedConflicts) {
        await git.abortMerge(this.path)
      }
      this.lastFetchedAt = await git.lastFetchedAt(this.path)
      // const fetchedSecondsAgo =
      //   (new Date().getTime() - this.lastFetchedAt) / 1000
      // console.log('LAST FETCH MS', fetchedSecondsAgo)
      // if (fetchedSecondsAgo > 60 * 1) {
      //   this.setFetching(true)
      //   await git.fetch(this.path)
      //   this.setFetching(false)
      // }
      const [status, uncommittedChanges] = await git.assesSyncStatus(this.path)
      this.uncommittedChanges = uncommittedChanges
      this.setSyncStatus(status)
    }
  }

  async analyzeLocal() {
    if (this.name) {
      this.wenv = await readRepoWenvConfig(this.name!)
    }
    this.uncommittedChanges = await git.getUncommittedChanges(this.path)
  }

  async fetch() {
    this.setFetching(true)
    await git.fetch(this.path)
    this.setFetching(false)
    await this.analyzeSyncStatus()
  }

  async trash() {
    await trash(this.path)
    this.setStatus('unknown')
  }

  async duplicate() {
    const name = this.name + '-copy'
    const dest = join('./repos', name)
    // Copy all files except .git repository
    await cp(this.path, dest, {
      recursive: true,
      filter: (filePath) => {
        // Skip anything inside .git
        return (
          !filePath.includes(`${path.sep}.git${path.sep}`) &&
          !filePath.endsWith(`${path.sep}.git`)
        )
      },
    })
    return new ActiveRepo(name)
  }

  async rename(newName: string) {
    const safeNewName = sanitizeRepoName(newName)
    const dest = join('./repos', safeNewName)
    await rename(this.path, dest)
    this.path = dest
    this.name = safeNewName
  }

  async commit(message: string) {
    if (this.uncommittedChanges) {
      await git.autoCommit(this.path, message)
      this.uncommittedChanges = ''
    }
  }

  async addRemote(url: string) {
    if (this.status[0] === 'git') {
      const resolvedUrl = await git.addRemote(this.path, url)
      this.setStatus('git-full', resolvedUrl, 'unknown')
      this.setFetching(true)
      if (await git.pull(this.path)) {
        this.setFetching(false)
        this.analyzeSyncStatus()
      } else {
        this.removeRemote()
      }
    }
  }

  async removeRemote() {
    if (this.status[0] === 'git-full') {
      await git.removeRemote(this.path)
      this.setStatus('git')
      this.setFetching(false)
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
      fetching: this.fetching,
      lastFetchedAt: this.lastFetchedAt,
      uncommittedChanges: this.uncommittedChanges,
      wenv: this.wenv,
    }
  }
}
