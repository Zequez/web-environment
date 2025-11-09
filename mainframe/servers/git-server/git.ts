import { stat, exists } from 'fs/promises'
import { join } from 'path'
import type { SyncStatus } from './messages'
import { mkdir } from 'fs/promises'

export type CommitLog = {
  date: Date
  message: string
  author: string
  hash: string
  isFirst: boolean
}

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
      await Bun.$`cd ${repoPath} && git config --get remote.origin.url`.quiet()

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
    await Bun.$`cd ${repoPath} && git rev-list --left-right --count HEAD...origin/main`.quiet()
  const parsedStatus = status.text().trim().split(/\s+/)
  const [ahead, behind] = parsedStatus.map((v) => parseInt(v, 10))

  return [ahead, behind]
}

export async function getUncommittedChanges(repoPath: string) {
  const changes = await Bun.$`cd ${repoPath} && git status --short`.quiet()
  return changes.text().trim()
}

export async function hasUncommittedChanges(repoPath: string) {
  const changes = await Bun.$`cd ${repoPath} && git status --short`.quiet()
  console.log('CHANGES', changes.text().trim())
  return !(changes.text().trim() === '')
}

export async function lastFetchedAt(repoPath: string) {
  const fetchHeadStat = await stat(join(repoPath, '.git/FETCH_HEAD'))
  return fetchHeadStat.mtimeMs
}

export async function assesSyncStatus(
  repoPath: string,
): Promise<[syncStatus: SyncStatus, uncommittedChanges: string]> {
  const uncommittedChanges = await getUncommittedChanges(repoPath)
  const commitPending = uncommittedChanges !== ''
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
    return ['diverged', uncommittedChanges]
  } else if (behind && !ahead) {
    return ['behind', uncommittedChanges]
  } else if (ahead && !behind) {
    return ['ahead', uncommittedChanges]
  } else {
    return ['in-sync', uncommittedChanges]
  }
}

export async function fetch(repoPath: string) {
  await Bun.$`cd ${repoPath} && git fetch`
}

export async function autoCommit(repoPath: string, message?: string) {
  const commitMessage = message
    ? message.replace(/"/g, '\\"')
    : `Auto-commit ${new Date().toISOString()}`
  await Bun.$`cd ${repoPath} && git add -A && git commit -m "${commitMessage}"`
}

export async function pull(repoPath: string) {
  const result = await Bun.$`cd ${repoPath} && git pull origin main`
    .nothrow()
    .quiet()
  const stderr = result.stderr.toString().toLowerCase()
  const stdout = result.stdout.toString().toLowerCase()
  if (stdout.match(/already up to date/)) {
    return true
  } else if (stderr.match(/does not appear to be a git repository/)) {
    return false
  } else if (stderr.match(/could not read from remote repository/)) {
    return true // Probably no internet
  } else if (stderr.match(/couldn't find remote ref main/)) {
    return true // Remote is empty; no worries
  } else {
    console.error({ error: stdout + stderr })
    return false
  }
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

export async function init(repoPath: string, branch: string = 'main') {
  await Bun.$`cd ${repoPath} && git init --initial-branch=${branch}`
}

export async function abortMerge(repoPath: string) {
  await Bun.$`cd ${repoPath} && git merge --abort`
}

export async function hasUnresolvedMergeConflicts(repoPath: string) {
  const output = await Bun.$`cd ${repoPath} && git ls-files -u`.quiet()
  // console.log('REPO PATH MERGE UNRESOLVED', repoPath)
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

export async function degitfy(repoPath: string) {
  await Bun.$`rm -rf ${repoPath}/.git`
}

export async function forcePushToOriginOnWwwBranch(
  dirPath: string,
  origin: string,
) {
  await degitfy(dirPath)
  await init(dirPath, 'www')
  await addRemote(dirPath, origin)
  await autoCommit(dirPath)
  // await Bun.$`cd ${dirPath} && git push --set-upstream origin www -f`

  const proc = Bun.spawn({
    cmd: [
      'git',
      '-C',
      dirPath,
      'push',
      '--set-upstream',
      'origin',
      'www',
      '-f',
    ],
    stderr: 'pipe',
    stdout: 'inherit',
  })

  const decoder = new TextDecoder()
  const reader = proc.stderr!.getReader()
  let stderrOutput = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    const text = decoder.decode(value)
    stderrOutput += text
    process.stderr.write(text)
  }

  const exitCode = await proc.exited
  if (exitCode !== 0) {
    return { success: false, error: stderrOutput }
  } else {
    return {
      success: true,
    }
  }
}

export async function removeRemote(repoPath: string) {
  await Bun.$`cd ${repoPath} && git remote rm origin`
}

export async function getLogHistory(repoPath: string): Promise<CommitLog[]> {
  // Custom format: <hash>|<author>|<date>|<message>
  const format = '%H|%an|%ad|%s'

  try {
    const firstCommitHash = (
      await Bun.$`cd ${repoPath} && git rev-list --max-parents=0 HEAD`.text()
    ).trim()

    const result =
      await Bun.$`cd ${repoPath} && git log -n 20 --date=iso --pretty=format:${format}`.text()

    const lines = result.trim().split('\n')

    const commits: CommitLog[] = lines.map((line, index) => {
      const [hash, author, date, message] = line.split('|')

      return {
        hash,
        author,
        message,
        date: new Date(date),
        isFirst: hash === firstCommitHash,
      }
    })

    return commits
  } catch (e) {
    console.error('Failed to retrieve git log:', e)
    return []
  }
}
