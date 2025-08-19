import { readdir, exists } from 'fs/promises'
import type { Repo } from './messages'
import { ActiveRepo } from './ActiveRepo'
import { debounce } from '@/center/utils'

// Assumes "main" branch and "origin" remote

export function startReposMonitor() {
  let R = new Map<string | null, ActiveRepo>()
  let subscribers: ((repos: Repo[]) => void)[] = []

  const notify = debounce(actuallyNotify, 100)

  ActiveRepo.setStatusChangeNotify(() => notify())

  R.set(null, new ActiveRepo(null))

  function outputRepos() {
    return [...R.values()]
      .map((v) => v.toJSON())
      .filter((r) => r.status[0] !== 'unknown')
  }

  function subscribe(cb: (repos: Repo[]) => void) {
    subscribers.push(cb)
    cb(outputRepos())
    return () => unsubscribe(cb)
  }

  function unsubscribe(cb: (repos: Repo[]) => void) {
    subscribers = subscribers.filter((c) => c !== cb)
  }

  function actuallyNotify() {
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

    console.log('REPOS PATH!', reposPaths)

    for (let repo of reposPaths) {
      if (!R.has(repo)) {
        const aRepo = await ActiveRepo.create(repo)
        if (aRepo) {
          R.set(repo, aRepo)
        }
      }
    }

    await cleanNonExistantRepos()

    await Promise.all(Array.from(R.values()).map((r) => r.analyze()))
  }

  async function cleanNonExistantRepos() {
    for (let repo of R.values()) {
      if (!(await exists(repo.path))) {
        R.delete(repo.name)
      }
    }
  }

  async function add(name: string) {
    const sanitizedName = sanitizeRepoName(name)
    console.log('Creating repo!', sanitizedName)
    if (!R.has(sanitizedName)) {
      const newRepo = await ActiveRepo.create(sanitizedName)
      if (newRepo) {
        await newRepo.analyze()
        console.log('Repo created!', sanitizedName, newRepo)
        R.set(sanitizedName, newRepo)
        notify()
        return true
      } else {
        return false
      }
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

  async function fetch(name: string | null) {
    const repo = R.get(name)
    if (repo) {
      await repo.fetch()
    }
  }

  async function fetchAll(name: string) {}

  function sanitizeRepoName(name: string) {
    return name.replace(/[^a-z0-9\-_]/gi, '')
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
    fetch,
    subscribe,
    add,
    remove,
    sync,
    addRemote,
    get repos() {
      return R
    },
  }
}

// Private
