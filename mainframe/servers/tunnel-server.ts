import { SERVER_TUNNEL_PORT } from '@/center/ports'
import { $path } from '@/center/utils/system'
import path from 'path'
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

      const forceUncached = fileRaw.startsWith('// @tunneled!')

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
                  forceUncached,
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
        const args = await req.json()
        const result = await runFun({
          filePath,
          pathnameFile,
          fun: fun!,
          args,
          forceUncached,
        })
        const stringified = JSON.stringify(result)
        console.log(` => ${stringified}`)
        return new Response(stringified, { headers })
      } catch (e) {
        console.log(e)
        return new Response(
          JSON.stringify({ success: false, error: String(e) }),
          {
            status: 400,
            statusText: `Something wrong running function ${e}`,
            headers,
          },
        )
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

      const { filePath, pathnameFile, fun, args, forceUncached } = ws.data as {
        filePath: string
        pathnameFile: string
        fun: string
        args: any[]
        forceUncached: boolean
      }

      const result = await runFun({
        filePath,
        pathnameFile,
        fun: fun!,
        args,
        forceUncached,
        callback: (response: any) => {
          const stringified = JSON.stringify(response)
          console.log(` => ${stringified}`)
          ws.send(stringified)
        },
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

async function runFun({
  filePath,
  pathnameFile,
  fun,
  args,
  forceUncached,
  callback,
}: {
  filePath: string
  pathnameFile: string
  fun: string
  args: any[]
  forceUncached: boolean
  callback?: (response: any) => void
}) {
  if (forceUncached) {
    console.log('Forcing uncachesd')
    // console.log(process._getActiveHandles())
    // console.log(Object.keys(require.cache))
    // console.log(require.cache[filePath])

    // delete require.cache[filePath]

    // console.log(require.cache[filePath])
    return await runFileOnSpawnedProcess(filePath, fun, args, callback)
  } else {
    const file = await import(filePath)
    console.log('RUN', `${pathnameFile} => ${fun}(${JSON.stringify(args)})`)
    if (callback) {
      return await file[fun as any](...args, callback)
    } else {
      return await file[fun as any](...args)
    }
  }
}

async function runFileOnSpawnedProcess(
  filePath: string,
  fun: string,
  args: any[],
  callback?: (msg: any) => void,
) {
  let stderrBuffer = ''
  let proc: any = null
  const promise = new Promise((resolve, reject) => {
    let TIMEOUT = 30
    let done = false
    const proc = Bun.spawn(
      [
        'bun',
        path.join(__dirname, 'tunnel-server-ipc-runner.ts'),
        filePath,
        fun,
        JSON.stringify(args),
        callback ? 'callback' : '',
      ],
      {
        stdout: 'inherit',
        stderr: 'pipe',
        ipc: (msg) => {
          done = true
          if (callback) {
            callback(msg)
          } else {
            resolve(msg)
          }
        },
      },
    )

    const decoder = new TextDecoder()
    ;(async () => {
      const reader = proc.stderr!.getReader()
      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        stderrBuffer += text
        process.stderr.write(text)
      }
    })()

    proc.exited.then(() => {
      if (!done) {
        const decoder = new TextDecoder()
        // No IPC message received → treat as failure
        resolve({
          success: false,
          error: stderrBuffer.trim().replace(/\u001b\[[0-9;]*m/g, ''),
        })
      }
    })

    setTimeout(() => {
      if (!done) {
        proc.kill()
        resolve({ success: false, error: 'TIMEOUT' })
      }
    }, TIMEOUT * 1000)
  })

  if (!callback) {
    return promise
  } else {
    return () => {
      if (proc) {
        proc.kill()
      }
    }
  }
}
