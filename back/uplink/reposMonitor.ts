import { readdir, stat, exists } from 'fs/promises'
import { join } from 'path'
import type { Repo, SyncStatus } from './messages'
import { mkdir } from 'fs/promises'
import trash from 'trash'
import { ActiveRepo } from './ActiveRepo'

// Assumes "main" branch and "origin" remote

export function startReposMonitor() {
  let R = new Map<string | null, ActiveRepo>()
  let subscribers: ((repos: Repo[]) => void)[] = []

  R.set(null, new ActiveRepo(null))

  function outputRepos() {
    return [...R.values()]
      .map((v) => v.toJSON())
      .filter((r) => r.status[0] !== 'unknown' && r.status[0] !== 'invalid')
  }

  function subscribe(cb: (repos: Repo[]) => void) {
    console.log('SUBSCRIBING!')
    subscribers.push(cb)
    cb(outputRepos())
    return () => unsubscribe(cb)
  }

  function unsubscribe(cb: (repos: Repo[]) => void) {
    console.log('UNSUBSCRIBING!')
    subscribers = subscribers.filter((c) => c !== cb)
  }

  function notify() {
    for (let cb of subscribers) {
      cb(outputRepos())
    }
  }

  // This will later be "initialize" and the refreshing
  // will be done fine-grained by watching the filesystem
  // and subscribing to Github events or setting up a polling
  // interval
  async function refresh() {
    console.log('Refreshing repos')
    const reposPaths = await readdir('./repos')

    let noLongerExists = [...R.keys()].filter((r) => r !== null)
    for (let repo of reposPaths) {
      noLongerExists = noLongerExists.filter((r) => r !== repo)
      if (!R.has(repo)) {
        const activeRepo = new ActiveRepo(repo)
        R.set(activeRepo.name, activeRepo)
      }
    }

    noLongerExists.forEach((repo) => {
      R.delete(repo)
    })

    for (let repo of R.values()) {
      await repo.analyze()
    }
  }

  async function add(name: string) {
    console.log('Creating repo!', name)
    const activeRepo = new ActiveRepo(name)
    if (!R.has(activeRepo.name)) {
      R.set(activeRepo.name, activeRepo)
      await activeRepo.init()
      notify()
    }
  }

  async function initGit(name: string) {
    const repo = R.get(name)
    if (repo) {
      await repo.initGit()
      notify()
    }
  }

  async function remove(name: string) {
    const repo = R.get(name)
    if (repo) {
      await repo.trash()
      R.delete(repo.name)
      notify()
    }
  }

  async function addRemote(name: string, url: string) {
    const repo = R.get(name)
    if (repo) {
      await repo.addRemote(url)
      notify()
    }
  }

  async function sync(name: string | null) {
    const repo = R.get(name)
    if (repo) {
      await repo.sync()
      // await repo.pull()
      notify()
    }
  }

  // async function fetchRepo(name: string) {
  //   const repo = repos.find((r) => r.name === name)
  //   if (repo && repo.status[0] === 'git-full') {
  //     const repoPath = join('./repos', name)
  //     await Bun.$`cd ${repoPath} && git fetch origin`
  //     console.log('Repo fetched')
  //   }
  // }

  return {
    refresh,
    subscribe,
    add,
    remove,
    sync,
    initGit,
    addRemote,
    get repos() {
      return R
    },
  }
}

// Private
