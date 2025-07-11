import chalk from 'chalk'
import { type ServerWebSocket } from 'bun'
import { UPLINK_PORT, VITE_PORT } from '../ports'
// import { type UplinkCmd, run } from './commands'

const allowed = ['http://localhost:2332']

// const clients = new Set<ServerWebSocket>()

function start() {
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
        console.log('UpGRADING!')
        return // Bun will handle the upgrade
      }

      return new Response('Upgrade failed', { status: 500 })
    },
    websocket: {
      message(ws, message) {
        ws.send(message) // echo back the message
      },
      open(ws) {
        console.log('Client connected')
        // clients.add(ws)
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

  return server
}

export { start }
