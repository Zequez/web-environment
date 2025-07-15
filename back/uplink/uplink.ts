import chalk from 'chalk'
import { type ServerWebSocket } from 'bun'
import { watch } from 'fs'
import { UPLINK_PORT, VITE_PORT } from '../ports'
import startReposWatch from './repos'
import { readdir, stat, exists } from 'fs/promises'
import { join } from 'path'
import { startReposMonitor } from './reposMonitor'
import { type BackMsg, type FrontMsg } from './messages'

const allowed = ['http://localhost:2332']

// const clients = new Set<ServerWebSocket>()

function sendMsg(ws: ServerWebSocket<any>, msg: BackMsg) {
  console.log('🟩', msg)
  return ws.send(JSON.stringify(msg))
}

function start() {
  const reposMonitor = startReposMonitor()

  const server = Bun.serve({
    port: UPLINK_PORT,
    async fetch(req) {
      if (req.method === 'OPTIONS') {
        return new Response(null, {
          status: 204, // No Content
          headers: {
            'Access-Control-Allow-Origin': allowed.join(', '),
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        })
      }

      console.log('Upgrading?')
      if (server.upgrade(req)) {
        console.log('Upgraded!')
        return // Bun will handle the upgrade
      }

      return new Response('Upgrade failed', { status: 500 })
    },
    websocket: {
      async message(ws, message) {
        try {
          const cmd = JSON.parse(message.toString()) as FrontMsg
          console.log('🔽', cmd)

          switch (cmd[0]) {
            case 'add-repo': {
              await reposMonitor.add(cmd[1])
              sendMsg(ws, ['repos-list', reposMonitor.repos])
              break
            }
            case 'init-repo-git': {
              await reposMonitor.initGit(cmd[1])
              sendMsg(ws, ['repos-list', reposMonitor.repos])
              break
            }
            case 'remove-repo': {
              await reposMonitor.remove(cmd[1])
              sendMsg(ws, ['repos-list', reposMonitor.repos])
              break
            }
            case 'add-remote': {
              await reposMonitor.addRemote(cmd[1], cmd[2])
              sendMsg(ws, ['repos-list', reposMonitor.repos])
              break
            }
          }
        } catch (e) {
          console.log('Invalid message', message)
        }
        // ws.send(message) // echo back the message
      },
      async open(ws) {
        console.log('Client connected')
        await reposMonitor.refresh()

        sendMsg(ws, ['repos-list', reposMonitor.repos])
      },

      close(ws) {
        console.log('Client disconnected')
        // clients.delete(ws)
      },
      drain(ws) {
        console.log('Client drain?')
      },
    },
  })

  console.log(
    `O servidor de uplink está em execução  http://localhost:${UPLINK_PORT}`,
  )
  // ;(async () => {
  //   await startReposWatch()
  // })()

  // function monitor() {
  //   /**
  //    * Watch repos/* directories
  //    * And also the mainframe root directory
  //    * For each directory check if:
  //    * - It's a directory
  //    * - It's a Git repo
  //    * - Compare with remote: synced, local-updated, remote-updated, conflict
  //    *
  //    *
  //    */

  //   watch('./repos', { recursive: true }, async (eventType, fileName) => {
  //     console.log(`📝 Arquivo modificado: ${fileName}`)
  //   })
  // }

  // monitor()

  return server
}

export { start }
