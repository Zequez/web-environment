import chalk from 'chalk'
import { createWebsocketServer } from '@/mainframe/basic-websocket'
import { SERVER_GIT_PORT } from '@/center/ports'

import { startReposMonitor } from './reposMonitor'
import { type BackMsg, type FrontMsg } from './messages'

function start() {
  const reposMonitor = startReposMonitor()

  createWebsocketServer<FrontMsg, BackMsg, {}>({
    port: SERVER_GIT_PORT,
    onConnect: async (sendMsg, params) => {
      // Send files list and updates
      await reposMonitor.refresh()
      return reposMonitor.subscribe((repos) => {
        sendMsg(['repos-list', repos])
      })
    },
    onMessage: async (msg, params, sendMsg) => {
      switch (msg[0]) {
        case 'add-repo': {
          await reposMonitor.add(msg[1])
          break
        }
        // case 'init-repo-git': {
        //   await reposMonitor.initGit(cmd[1])
        //   break
        // }
        case 'remove-repo': {
          await reposMonitor.remove(msg[1])
          break
        }
        case 'add-remote': {
          await reposMonitor.addRemote(msg[1], msg[2])
          break
        }
        case 'sync': {
          await reposMonitor.sync(msg[1])
          break
        }
        case 'fetch': {
          await reposMonitor.fetch(msg[1])
          break
        }
        case 'fetch-all': {
          // await reposMonitor.fetchAll()
          break
        }
      }
    },
  })
}

start()
