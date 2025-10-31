import { SERVER_TUNNEL_PORT } from '@/center/ports'
import type { Repo } from '@/mainframe/servers/git-server/messages'

type ApiMap = {
  'mainframe/tunnels/publishing.ts/buildRepo': (repo: string) => boolean
  'mainframe/tunnels/publishing.ts/publishRepo': (repo: string) => boolean
  'mainframe/tunnels/list-repos.ts': () => Repo[]
  'mainframe/tunnels/saveCanvaReposPositions.ts': (repos: {
    [key: string]: { x: number; y: number }
  }) => void
}

export async function tunnel<F extends keyof ApiMap>(
  fun: F,
  ...args: Parameters<ApiMap[F]>
): Promise<ReturnType<ApiMap[F]>> {
  const response = await fetch(
    `http://localhost:${SERVER_TUNNEL_PORT}/${fun}`,
    {
      method: 'POST',
      body: JSON.stringify(args),
    },
  )

  return response.json()
}

export function streamTunnel<T extends any[], K>(fun: string, ...args: T) {
  const lastFun = fun.split('/').pop()
  if (!lastFun!.startsWith('stream')) {
    throw 'Function not streamable'
  }

  return (cb: (v: K) => void) => {
    const body = btoa(JSON.stringify(args))
    const ws = new WebSocket(
      `ws://localhost:${SERVER_TUNNEL_PORT}/${fun}?body=${body}`,
    )

    ws.addEventListener('message', (ev) => {
      const data = JSON.parse(ev.data) as K
      cb(data)
    })

    return () => {
      ws.close()
    }
  }
}
