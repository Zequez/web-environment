import { createServer, type ViteDevServer } from 'vite'

import { signal, computed } from '@preact/signals-core'

import { createWebsocketServer } from '@/mainframe/basic-websocket'
import { SERVER_VITE_SPINNER_PORT } from '@/center/ports'
import repoVite from './repo-vite'
import { getRepoConfig, getStartedRepos, setRepoConfig } from './persisted'

export type BackMsg = ['servers', servers: { [key: string]: string }]
export type FrontMsg = ['start', repo: string] | ['stop', repo: string]
// | ['build', repo: string]
// | ['publish', repo: string]

let reposServers = signal<{ [key: string]: ViteDevServer }>({})

let reposServersUrl = computed(() => {
  return Object.fromEntries(
    Object.entries(reposServers.value).map(([key, value]) => [
      key,
      value.resolvedUrls?.local?.[0]!,
    ]),
  )
})

let REPOS_VITE: { [key: string]: Awaited<ReturnType<typeof repoVite>> } = {}
async function getRepoVite(repo: string) {
  if (REPOS_VITE[repo]) {
    return REPOS_VITE[repo]
  } else {
    const repoConfig = await getRepoConfig(repo)
    const vite = await repoVite(repo, repoConfig)
    REPOS_VITE[repo] = vite
    return vite
  }
}

async function startNewServer(repo: string) {
  console.log(`Spinning new vite server for ${repo}`)
  const vite = await getRepoVite(repo)

  const newViteServer = await vite.devRun()

  reposServers.value = {
    ...reposServers.value,
    [repo]: newViteServer,
  }

  const repoConfig = await getRepoConfig(repo)
  if (!repoConfig.started) {
    setRepoConfig(repo, { started: true })
  }

  console.log(`DONE ${repo}`)
}

function start() {
  const server = createWebsocketServer<FrontMsg, BackMsg, {}>({
    port: SERVER_VITE_SPINNER_PORT,
    onMessage: async (msg, params, sendMsg) => {
      const [, repo] = msg

      switch (msg[0]) {
        case 'start':
          if (!reposServers.value[repo]) {
            await startNewServer(repo)
          }
          break
        case 'stop':
          if (reposServers.value[repo]) {
            console.log(
              'Closing repo',
              repo,
              JSON.stringify(Object.keys(reposServers.value)),
            )
            try {
              reposServers.value[repo].close()
            } catch (e) {
              console.log('Server failed to close, deleting anyway')
            }
            console.log('Whats going on?')
            delete reposServers.value[repo]
            reposServers.value = { ...reposServers.value }
            setRepoConfig(repo, { started: false })
          }
          break
        // case 'build': {
        //   const vite = await getRepoVite(repo)
        //   await vite.buildProjection()

        //   break
        // }
        // case 'publish': {
        //   const vite = await getRepoVite(repo)
        //   await vite.publishProjection()
        //   break
        // }
      }
    },
    onConnect: async (sendMsg, params) => {
      // Send files list and updates
      return reposServersUrl.subscribe((servers) => {
        console.log('Sending servers update', servers)
        sendMsg(['servers', servers])
      })
    },
  })

  getStartedRepos().forEach((repo) => {
    startNewServer(repo)
  })

  return server
}

const cleanup = () => {
  console.log('STOPPING')
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
process.on('exit', cleanup)

start()
