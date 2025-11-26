import type { Plugin } from 'vite'

let paused = false

export function hmrGate(): Plugin {
  return {
    name: 'hmr-gate',

    handleHotUpdate() {
      if (paused) {
        return [] // swallow all updates
      }
    },

    configureServer(server) {
      server.ws.on('connection', (socket) => {
        socket.on('message', (raw) => {
          try {
            const msg = JSON.parse(raw.toString())

            if (msg?.type !== 'hmr-gate') return

            if (msg.action === 'pause') {
              paused = true
              console.log('[HMR] paused')
            }

            if (msg.action === 'resume') {
              paused = false
              console.log('[HMR] resumed')
            }

            if (msg.action === 'reload') {
              paused = false
              server.ws.send({ type: 'full-reload' })
              console.log('[HMR] reloaded')
            }
          } catch {}
        })
      })
    },
  }
}
