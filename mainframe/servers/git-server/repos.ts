import { promises as fs } from 'node:fs'
import path from 'node:path'
import chokidar from 'chokidar'
import { execFile } from 'node:child_process'

export type RepoState = 'ahead' | 'behind' | 'diverged' | 'in-sync'

const repos = new Map<string, RepoState>()

/** Initial sweep */
async function findRepos(root: string) {
  const dirents = await fs.readdir(root, { withFileTypes: true })
  await Promise.all(
    dirents.map(async (d) => {
      const p = path.join(root, d.name)
      if (d.isDirectory()) {
        if (d.name === '.git') addRepo(path.dirname(p))
        else await findRepos(p) // recurse
      }
    }),
  )
}

/** Keep discovery running with ONE watcher */
const discWatcher = chokidar.watch(process.cwd(), {
  depth: 0, // stop long walks; new .git deeper will re-trigger anyway
  ignoreInitial: true,
})

discWatcher.on('addDir', (p) => {
  if (path.basename(p) === '.git') addRepo(path.dirname(p))
})

function addRepo(repoPath: string) {
  if (repos.has(repoPath)) return

  // Watch just three files – cheap!
  const watchTargets = [
    path.join(repoPath, '.git', 'HEAD'),
    path.join(repoPath, '.git', 'config'), // remote URL changes
    path.join(repoPath, '.git', 'refs', 'heads'), // any local branch tip
  ]

  const w = chokidar.watch(watchTargets, { ignoreInitial: true })
  const refetch = debounce(() => updateState(repoPath), 500)

  w.on('all', refetch)
  repos.set(repoPath, 'in-sync')

  // do an immediate first check
  updateState(repoPath)
}

async function updateState(repo: string) {
  try {
    // 1. remote changed?
    const dry = await exec('fetch', ['--dry-run', '--quiet'], repo)
    if (dry) console.log(`Remote updated ➜ ${repo}`)

    // 2. ahead / behind counts
    const out = await exec(
      'rev-list',
      ['--left-right', '--count', '@{u}...HEAD'],
      repo,
    )
    const [behind, ahead] = out.trim().split(/\s+/).map(Number)

    const state: RepoState =
      ahead && behind
        ? 'diverged'
        : ahead
          ? 'ahead'
          : behind
            ? 'behind'
            : 'in-sync'

    if (state !== repos.get(repo)) {
      repos.set(repo, state)
      console.log(`[${repo}] state →`, state)
    }
  } catch (err: any) {
    // happens if there is no upstream yet, etc.
    console.error(repo, err.message)
  }
}

/** tiny helper */
function exec(cmd: string, args: string[], cwd: string): Promise<string> {
  return new Promise((res, rej) => {
    const p = execFile('git', [cmd, ...args], { cwd }, (err, stdout) => {
      if (err && err.code !== 1) return rej(err) // git returns 1 for "no change"
      res(stdout.toString())
    })
  })
}

/** simple 500 ms debounce */
function debounce<T extends any[]>(fn: (...a: T) => void, ms: number) {
  let t: any
  return (...a: T) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...a), ms)
  }
}

async function start() {
  await findRepos(path.join(process.cwd(), 'repos'))
  console.log('Watching', repos.size, 'repositories…')
}

export default start
