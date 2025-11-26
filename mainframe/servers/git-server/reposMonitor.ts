import { readdir, exists } from 'fs/promises'
import type { Repo } from './messages'
import { ActiveRepo } from './ActiveRepo'
import { debounce } from '@/center/utils/neutral'

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
    console.log(reposPaths)

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

  async function addFromUrl(url: string) {
    const nameFromUrl = url.split('/').pop()?.replace(/.git$/, '') || null

    console.log('Creating repo!', nameFromUrl)
    if (nameFromUrl && !R.has(nameFromUrl)) {
      const newRepo = await ActiveRepo.createFromUrl(nameFromUrl!, url)
      if (newRepo) {
        await newRepo.analyze()
        console.log('Repo cloned and created!', nameFromUrl, url, newRepo)
        R.set(nameFromUrl, newRepo)
        notify()
        return true
      } else {
        return false
      }
    } else {
      return false
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

  async function duplicate(name: string) {
    const repo = R.get(name)
    if (repo) {
      const newRepo = await repo.duplicate()
      await newRepo.analyze()
      R.set(newRepo.name, newRepo)
      notify()
    }
  }

  async function rename(name: string, newName: string) {
    const repo = R.get(name)
    const maybeExists = R.get(newName)
    if (maybeExists || !repo) {
      return false
    } else {
      await repo.rename(newName)
      R.set(repo.name, repo)
      R.delete(name)
      notify()
    }
  }

  async function commit(name: string | null, message: string) {
    const repo = R.get(name)
    if (repo) {
      await repo.commit(message)
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

  async function removeRemote(name: string) {
    const repo = R.get(name)
    if (repo) {
      await repo.removeRemote()
      console.log(repo.toJSON())
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

  async function fetchAll() {
    for (let repo of R.values()) {
      await repo.fetch()
    }
  }

  async function analyzeAll() {
    for (let repo of R.values()) {
      await repo.analyzeLocal()
    }
    notify()
  }

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
    addFromUrl,
    remove,
    rename,
    duplicate,
    commit,
    sync,
    addRemote,
    removeRemote,
    fetchAll,
    analyzeAll,
    get repos() {
      return R
    },
  }
}

// Private
