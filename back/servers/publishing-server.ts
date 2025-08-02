// Builds target repo using Vite configuration
// Force-push target repo built output as www branch
// Gets list of outputs and time of generation

// Maybe later: Different publishing strategy other than Git, for example
// FTP server, directly to Vercel, Cloudflare, etc

import { createWebsocketServer } from '@/back/basic-websocket'
import { SERVER_FILES_PORT } from '../../center/ports'
import { existsSync } from 'fs'

console.log('############# PUBLISHING SERVER')

type OutputData = {
  createdAt: number
  size: number
}

export type BackMsg = ['outputs', repos: { [key: string]: OutputData }]
export type FrontMsg = ['build', repo: string] | ['publish', repo: string]

function start() {
  const server = createWebsocketServer<FrontMsg, BackMsg, { repo: string }>({
    port: SERVER_FILES_PORT,
    onMessage: (msg, params, sendMsg) => {
      const basePath = `repos/${params.repo}`
      if (!existsSync(basePath)) {
        return
      }

      switch (msg[0]) {
        case 'build':
          break
        case 'publish':
          break
      }
    },
    onConnect: async (sendMsg, params) => {
      // Send files list and updates
      let closeWatcher = () => {}

      return closeWatcher
    },
  })

  console.log('Publishing server started')

  return server
}

start()
