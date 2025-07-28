import chalk from 'chalk'
import { type ServerWebSocket } from 'bun'
import { watch } from 'fs'
import { readdir, stat, exists } from 'fs/promises'
import { join } from 'path'

export function createWebsocketServer<T, K>(
  handleClientMessage: (msg: T) => void,
  onClientConnect: (
    sendMsg: (msg: K) => void,
    ws: ServerWebSocket<unknown>,
  ) => () => void,
  clientPort: number,
  serverPort: number,
) {
  const allowed = [`http://localhost:${clientPort}`]
  const clientsSubscriptions = new Map<ServerWebSocket<any>, () => void>()

  function sendMsg(ws: ServerWebSocket<any>, msg: K) {
    console.log('🟩', msg)
    return ws.send(JSON.stringify(msg))
  }

  const server = Bun.serve({
    port: serverPort,
    async fetch(req) {
      console.log('REFERRER!', req.headers)
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
        let cmd: T = null!
        try {
          cmd = JSON.parse(message.toString()) as T
          console.log('🔽', cmd)
        } catch (e) {
          console.log('Invalid message', message)
          return
        }

        try {
          handleClientMessage(cmd)
        } catch (e) {
          console.log('Server', e)
        }
      },
      async open(ws) {
        console.log('Client connected')
        const subscription = onClientConnect(sendMsg.bind(null, ws), ws)
        clientsSubscriptions.set(ws, subscription)
      },

      close(ws) {
        console.log('Client disconnected')
        const unsub = clientsSubscriptions.get(ws)
        if (unsub) unsub()
        clientsSubscriptions.delete(ws)
      },
      drain(ws) {
        console.log('Client drain?')
      },
    },
  })

  console.log(
    `O servidor de uplink está em execução  http://localhost:${serverPort}`,
  )

  return server
}
