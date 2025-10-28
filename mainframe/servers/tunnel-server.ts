import { SERVER_TUNNEL_PORT } from '@/center/ports'
import { $path } from '@/center/utils/system'
import { readFileSync } from 'node:fs'
import { type ServerWebSocket } from 'bun'

const allowedOrigins = /^http:\/\/localhost:\d+$/

const server = Bun.serve({
  port: SERVER_TUNNEL_PORT,
  async fetch(req) {
    const headers = new Headers({ 'Content-Type': 'application/json' })

    const origin = req.headers.get('origin') || ''

    console.log(origin, req.method)

    if (!allowedOrigins.test(origin)) {
      return new Response(JSON.stringify({}), { status: 400, headers })
    }

    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Vary', 'Origin')

    if (req.method === 'OPTIONS') {
      headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
      headers.set('Access-Control-Allow-Headers', 'Content-Type')
      return new Response(JSON.stringify({}), { status: 204, headers })
    } else {
      const url = new URL(req.url)
      const pathnameParts = url.pathname.slice(1).split('/')
      const fun = pathnameParts[pathnameParts.length - 1].endsWith('.ts')
        ? 'default'
        : pathnameParts.pop()
      const pathnameFile = pathnameParts.join('/')

      const filePath = $path(pathnameFile)

      const fileRaw = readFileSync(filePath, 'utf-8')
      if (!fileRaw.startsWith('// @tunneled')) {
        return new Response(null, {
          status: 404,
          statusText: 'Requested endpoint not a tunnel',
          headers,
        })
      }

      if (fun!.startsWith('stream')) {
        console.log('Upgrading request to WebSocket')
        const params = Object.fromEntries(url.searchParams)

        if (params.body) {
          function parseBody() {
            try {
              return JSON.parse(atob(params.body))
            } catch (e) {
              return null
            }
          }

          let body = parseBody()

          if (body) {
            if (
              server.upgrade(req, {
                data: {
                  pathnameFile,
                  filePath,
                  fun,
                  args: body,
                },
              })
            ) {
              return
            } else {
              return new Response('Upgrade failed: websocket', {
                status: 500,
                headers,
              })
            }
          } else {
            return new Response('Upgrade failed: no body', {
              status: 400,
              headers,
            })
          }
        }
      }

      try {
        const file = await import(filePath)
        const body = await req.json()
        console.log('RUN', `${pathnameFile} => ${fun}(${JSON.stringify(body)})`)
        const result = await file[fun as any](...body)
        console.log(` => ${JSON.stringify(result)}`)
        return new Response(JSON.stringify(result), { headers })
      } catch (e) {
        console.log(e)
        return new Response(JSON.stringify({ error: String(e) }), {
          status: 400,
          statusText: `Something wrong running function ${e}`,
          headers,
        })
      }
    }

    // return new Response(JSON.stringify({}), { status: 404, headers })
  },
  websocket: {
    async message(ws, message) {
      console.log('Received WS message')
    },
    async open(ws) {
      console.log('Stream client connected', ws.data)

      const { filePath, pathnameFile, fun, args } = ws.data as {
        filePath: string
        pathnameFile: string
        fun: string
        args: any[]
      }

      const file = await import(filePath)
      console.log('RUN', `${pathnameFile} => ${fun}(${JSON.stringify(args)})`)
      const result = await file[fun as any](...args, (response: any) => {
        ws.send(JSON.stringify(response))
      })
      clientsSubscriptions.set(ws, () => {
        if (typeof result === 'function') {
          result()
        } else {
          console.warn('steam function should return a destroy-function')
        }
      })
    },
    async close(ws) {
      console.log('Stream client closed')
      const stopStream = clientsSubscriptions.get(ws)
      if (stopStream) {
        stopStream()
      }
    },
    drain(ws) {
      console.log('Client... drained?')
    },
  },
})

const clientsSubscriptions = new Map<ServerWebSocket<any>, () => void>()

// async function runFun(filePath: string, fun: string, args: any[]) {
//   const file = await import(filePath)
//   console.log('RUN', `${pathnameFile} => ${fun}(${JSON.stringify(body)})`)
//   const result = await file[fun as any](body)
//   console.log(` => ${JSON.stringify(result)}`)
// }
