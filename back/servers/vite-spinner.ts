import { createServer, type ViteDevServer } from 'vite'
import { signal, computed } from '@preact/signals-core'
import chalk from 'chalk'

import { createWebsocketServer } from '@/back/basic-websocket'
import { SERVER_VITE_SPINNER_PORT, UI_PORT_FOR_REPO } from '@/center/ports'
import editorGenViteConfig from '@/substrates/editor/vite.config.gen'

export type BackMsg = ['servers', servers: { [key: string]: string }]
export type FrontMsg = ['start', repo: string] | ['stop', repo: string]

let reposServers = signal<{ [key: string]: ViteDevServer }>({})

// function startBunWatcherProcess(scriptPath: string) {
//   console.log(chalk.yellow(`STARTING VITE SERVER ${scriptPath}`))
//   return Bun.spawn(['bun', 'run', '--watch', '--no-clear-screen', scriptPath], {
//     stdout: 'inherit',
//     stderr: 'inherit',
//   })
// }

let reposServersUrl = computed(() => {
  return Object.fromEntries(
    Object.entries(reposServers.value).map(([key, value]) => [
      key,
      value.resolvedUrls?.local?.[0]!,
    ]),
  )
})

function start() {
  const server = createWebsocketServer<FrontMsg, BackMsg, {}>({
    name: 'Vite Spinner',
    // Purple
    color: chalk.rgb(160, 32, 240),
    port: SERVER_VITE_SPINNER_PORT,
    onMessage: async (msg, params, sendMsg) => {
      const [, repo] = msg

      async function startNewServer() {
        console.log(`Spinning new vite server for ${repo}`)
        const port = UI_PORT_FOR_REPO(repo)
        const newViteServer = await createServer(
          editorGenViteConfig(repo, port),
        )
        await newViteServer.listen()
        reposServers.value = {
          ...reposServers.value,
          [repo]: newViteServer,
        }
      }

      switch (msg[0]) {
        case 'start':
          if (!reposServers.value[repo]) {
            await startNewServer()
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

  return server
}

const cleanup = () => {
  Promise.all([
    ...Object.entries(reposServers.value).map(([key, value]) => value.close()),
  ])

  console.log('Vite spinned servers cleanup finished')
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
process.on('exit', cleanup)

start()
