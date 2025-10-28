import { SERVER_TUNNEL_PORT } from '@/center/ports'

export async function tunnel<T extends [], K>(
  fun: string,
  ...args: T
): Promise<K> {
  const response = await fetch(
    `http://localhost:${SERVER_TUNNEL_PORT}/${fun}`,
    {
      method: 'POST',
      body: JSON.stringify(args),
    },
  )
  return response.json() as Promise<K>
}
export function streamTunnel<T extends [], K>(fun: string, ...args: T) {
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
