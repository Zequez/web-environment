import { createServer, type ViteDevServer } from 'vite'

import { signal, computed } from '@preact/signals-core'

import { createWebsocketServer } from '@/back/basic-websocket'
import { SERVER_VITE_SPINNER_PORT } from '@/center/ports'
import { readRepoWenvConfig } from '@/center/wenv-config'
import { DEFAULT_SUBSTRATE, SUBSTRATES } from '@/center/substrates'
import { getRepoConfig, getStartedRepos, setRepoConfig } from './persisted'

export type BackMsg = ['servers', servers: { [key: string]: string }]
export type FrontMsg = ['start', repo: string] | ['stop', repo: string]

let reposServers = signal<{ [key: string]: ViteDevServer }>({})

let reposServersUrl = computed(() => {
  return Object.fromEntries(
    Object.entries(reposServers.value).map(([key, value]) => [
      key,
      value.resolvedUrls?.local?.[0]!,
    ]),
  )
})

async function startNewServer(repo: string) {
  console.log(`Spinning new vite server for ${repo}`)
  const repoConfig = await getRepoConfig(repo)
  const config = readRepoWenvConfig(repo)

  const generator =
    SUBSTRATES[(config.substrate as string) || DEFAULT_SUBSTRATE]
  const newViteServer = await createServer(
    generator({
      repo,
      port: repoConfig.port,
      accessibleFromLocalNetwork: repoConfig.accessibleFromLocalNetwork,
    }),
  )
  await newViteServer.listen()
  reposServers.value = {
    ...reposServers.value,
    [repo]: newViteServer,
  }
  if (!repoConfig.started) {
    setRepoConfig(repo, { started: true })
  }
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
