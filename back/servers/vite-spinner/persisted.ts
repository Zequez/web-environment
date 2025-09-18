import { REPOS_PORT_BASE } from '@/center/ports'
import { isPortUsed, yamlFileStore } from '@/center/utils/system'
import path from 'path'

const STATE_FILE = path.join(__dirname, './persisted-state.yml')

type PersistedState = {
  repos: {
    [key: string]: RepoConfig
  }
}

type RepoConfig = {
  started: boolean
  port: number
  accessibleFromLocalNetwork: boolean
}

const persistedState = yamlFileStore<PersistedState>(STATE_FILE, { repos: {} })

function usedPorts() {
  return Object.values(persistedState.value.repos).map(({ port }) => port)
}

async function getNextAvailablePort() {
  let ports = usedPorts()

  if (ports.length === 0) {
    ports = [REPOS_PORT_BASE]
  }
  let nextPort: number = Math.max(...ports)
  do {
    nextPort++
  } while (await isPortUsed(nextPort))

  return nextPort
}

export async function getRepoConfig(repo: string) {
  if (persistedState.value.repos[repo]) {
    return persistedState.value.repos[repo]
  } else {
    const newConfig = {
      started: true,
      port: await getNextAvailablePort(),
      accessibleFromLocalNetwork: false,
    }
    setRepoConfig(repo, newConfig)
    return newConfig
  }
}

export function setRepoConfig(repo: string, val: Partial<RepoConfig>) {
  let resolved = {
    ...(persistedState.value.repos[repo] || {}),
    ...val,
  } as RepoConfig
  persistedState.value = {
    ...persistedState.value,
    repos: {
      ...persistedState.value.repos,
      [repo]: resolved,
    },
  }
}

export function getStartedRepos() {
  return Object.keys(persistedState.value.repos).filter(
    (repo) => persistedState.value.repos[repo].started,
  )
}
