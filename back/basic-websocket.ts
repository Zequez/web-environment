import { type ServerWebSocket } from 'bun'

const allowedOrigins = /^http:\/\/localhost:\d+$/
type Config<T, K, Params> = {
  onConnect: (sendMsg: (msg: K) => void, params: Params) => Promise<() => void>
  onMessage: (msg: T, params: Params, sendMsg: (msg: K) => void) => void
  port: number
}

export function createWebsocketServer<T, K, Params>(
  config: Config<T, K, Params>,
) {
  const clientsSubscriptions = new Map<ServerWebSocket<any>, () => void>()

  function sendMsg(ws: ServerWebSocket<any>, msg: K) {
    console.log('🟩', msg)
    return ws.send(JSON.stringify(msg))
  }

  const server = Bun.serve({
    port: config.port,
    async fetch(req) {
      const origin = req.headers.get('origin') || ''
      if (req.method === 'OPTIONS') {
        const headers = new Headers()
        if (!allowedOrigins.test(origin)) {
          headers.set('Access-Control-Allow-Origin', origin)
          headers.set('Vary', 'Origin')
        }

        headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        headers.set('Access-Control-Allow-Headers', 'Content-Type')
        return new Response(null, { status: 204, headers })
      }

      if (
        server.upgrade(req, {
          data: {
            params: Object.fromEntries(new URL(req.url).searchParams),
          },
        })
      ) {
        return // Bun will handle the upgrade
      }

      console.error('Websocket upgrade failed')
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
          config.onMessage(
            cmd,
            (ws.data as any).params as Params,
            sendMsg.bind(null, ws),
          )
        } catch (e) {
          console.log('Server', e)
        }
      },
      async open(ws) {
        console.log('Client connected')
        const subscription = await config.onConnect(
          sendMsg.bind(null, ws),
          (ws.data as any).params as Params,
        )
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

  console.log(`Running   http://localhost:${config.port}`)

  return server
}
