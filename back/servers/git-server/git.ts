import { stat, exists } from 'fs/promises'
import { join } from 'path'
import type { SyncStatus } from './messages'
import { mkdir } from 'fs/promises'

export async function ensurePathIsRepo(repoPath: string) {
  if (!(await exists(repoPath))) {
    await mkdir(repoPath, { recursive: true })
  }

  const stats = await stat(repoPath)
  if (!stats.isDirectory()) {
    return false
  }

  if (!(await isGitRepo(repoPath))) {
    await init(repoPath)
  }

  return true
}

// export async function analyzePath(
//   repoPath: string,
// ): Promise<null | 'invalid' | 'is-available' | 'is-dir' | 'dir-git'> {
//   if (!await exists(repoPath)) {
//     return 'no-dir';
//   }

//   const stats = await stat(repoPath)
//   if (stats.isDirectory()) {
//     // console.log(`${repoPath} is directory`)
//     const gitPath = join(repoPath, '.git')
//     if ((await exists(gitPath)) && (await stat(gitPath)).isDirectory()) {
//       // console.log(`${repoPath} is git repo`)
//       return 'dir-git'
//     } else {
//       // console.log(`${repoPath} is not git repo`)
//       return 'dir'
//     }
//   } else {
//     if (stats.isFile()) {
//       return 'file'
//     } else {
//       return 'no-dir'
//     }
//     return null
//   }
// }

export async function remoteUrl(repoPath: string): Promise<null | string> {
  // Read origin URL from .git/config
  try {
    const url =
      await Bun.$`cd ${repoPath} && git config --get remote.origin.url`

    const remote = url.text().trim()
    // console.log('Remote', remote)

    return remote
  } catch (err) {
    // console.log('Repo has no remote')
    return null
  }
}

export async function aheadBehind(repoPath: string) {
  const status =
    await Bun.$`cd ${repoPath} && git rev-list --left-right --count HEAD...origin/main`
  const parsedStatus = status.text().trim().split(/\s+/)
  const [ahead, behind] = parsedStatus.map((v) => parseInt(v, 10))

  return [ahead, behind]
}

export async function hasUncommittedChanges(repoPath: string) {
  const changes = await Bun.$`cd ${repoPath} && git status --short`
  return !(changes.text().trim() === '')
}

export async function lastFetchedAt(repoPath: string) {
  const fetchHeadStat = await stat(join(repoPath, '.git/FETCH_HEAD'))
  return fetchHeadStat.mtimeMs
}

export async function assesSyncStatus(
  repoPath: string,
): Promise<[syncStatus: SyncStatus, commitPending: boolean]> {
  const commitPending = await hasUncommittedChanges(repoPath)
  const zeroLocalCommits = await zeroCommits(repoPath, 'local')
  const zeroRemoteCommits = await zeroCommits(repoPath, 'remote')

  // If either remote or local have no commits we cannot call the
  // status function

  let ahead: number
  let behind: number

  if (zeroLocalCommits || zeroRemoteCommits) {
    ahead = zeroLocalCommits ? 0 : 1
    behind = zeroRemoteCommits ? 0 : 1
    if (commitPending) ahead++
  } else {
    ;[ahead, behind] = await aheadBehind(repoPath)
    if (commitPending) ahead++
  }

  if (behind && ahead) {
    return ['diverged', commitPending]
  } else if (behind && !ahead) {
    return ['behind', false]
  } else if (ahead && !behind) {
    return ['ahead', commitPending]
  } else {
    return ['in-sync', false]
  }
}

export async function fetch(repoPath: string) {
  await Bun.$`cd ${repoPath} && git fetch`
}

export async function autoCommit(repoPath: string) {
  await Bun.$`cd ${repoPath} && git add -A && git commit -m "Auto-commit ${new Date().toISOString()}" && git push`
}

export async function pull(repoPath: string) {
  await Bun.$`cd ${repoPath} && git pull origin main`
}

export async function push(repoPath: string) {
  await Bun.$`cd ${repoPath} && git push --set-upstream origin main`
}

export async function attemptAutomerge(repoPath: string) {
  try {
    await Bun.$`cd ${repoPath} && git merge --no-edit origin/main`
    return true
  } catch (e) {
    await abortMerge(repoPath)
    return false
  }
}

export async function addRemote(repoPath: string, remoteUrl: string) {
  let resolvedUrl = remoteUrl
  if (remoteUrl.startsWith('https://github.com/')) {
    if (!remoteUrl.endsWith('.git')) {
      resolvedUrl = `${remoteUrl}.git`
    }
  }
  await Bun.$`cd ${repoPath} && git remote add origin ${resolvedUrl}`
  return resolvedUrl
}

export async function init(repoPath: string) {
  await Bun.$`cd ${repoPath} && git init`
}

export async function abortMerge(repoPath: string) {
  await Bun.$`cd ${repoPath} && git merge --abort`
}

export async function hasUnresolvedMergeConflicts(repoPath: string) {
  const output = await Bun.$`cd ${repoPath} && git ls-files -u`
  console.log('REPO PATH MERGE UNRESOLVED', repoPath, output.text())
  return output.text().trim() !== ''
}

export async function zeroCommits(
  repoPath: string,
  target: 'remote' | 'local',
) {
  const tragetRef =
    target === 'remote' ? 'refs/remotes/origin/main' : 'refs/heads/main'
  try {
    await Bun.$`cd ${repoPath} && git show-ref --verify --quiet ${tragetRef}`
    return false
  } catch (e) {
    return true
  }
}

export async function isGitRepo(repoPath: string) {
  const stats = await stat(repoPath)
  if (!stats.isDirectory()) {
    return false
  }

  const gitPath = join(repoPath, '.git')
  if (!(await exists(gitPath))) {
    return false
  }

  const gitStats = await stat(join(repoPath, '.git'))
  return gitStats.isDirectory()
}
