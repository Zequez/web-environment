// Builds target repo using Vite configuration
// Force-push target repo built output as www branch
// Gets list of outputs and time of generation

// Maybe later: Different publishing strategy other than Git, for example
// FTP server, directly to Vercel, Cloudflare, etc

import { build } from 'vite'

import { createWebsocketServer } from '@/mainframe/basic-websocket'
import { SERVER_PUBLISHING_PORT } from '@/center/ports'
import { $path } from '@/center/utils/system'

import { forcePushToOriginOnWwwBranch, remoteUrl } from './git-server/git'
import { DEFAULT_SUBSTRATE, SUBSTRATES } from '@/center/substrates'
import { readRepoWenvConfig } from '@/center/wenv-config'

type OutputData = {
  createdAt: number
  size: number
}

export type BackMsg = ['outputs', repos: { [key: string]: OutputData }]
export type FrontMsg = ['build', repo: string] | ['publish', repo: string]

function start() {
  const server = createWebsocketServer<FrontMsg, BackMsg, {}>({
    port: SERVER_PUBLISHING_PORT,
    onMessage: async (msg, params, sendMsg) => {
      switch (msg[0]) {
        case 'build': {
          const [, repo] = msg
          const config = readRepoWenvConfig(repo as string)
          const generator = SUBSTRATES[config.substrate || DEFAULT_SUBSTRATE]
          const result = await build(
            generator({ repo, port: 0, accessibleFromLocalNetwork: false }),
          )
          console.log('REPO BUILT!')
          break
        }
        case 'publish': {
          const [, repo] = msg
          const origin = await remoteUrl($path(`repos/${repo}`))
          if (origin) {
            await forcePushToOriginOnWwwBranch(
              $path(`projections/${repo}`),
              origin,
            )
          }
          break
        }
      }
    },
    onConnect: async (sendMsg, params) => {
      // Send files list and updates
      let closeWatcher = () => {}

      return closeWatcher
    },
  })

  return server
}

start()
