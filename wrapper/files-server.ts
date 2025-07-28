import { createWebsocketServer } from '@back/uplink/basic-websocket'
import { WRAPPER_PORT, FILES_SERVER_PORT } from '../back/ports'

console.log('WRAPPER FILE SERVERs')

export type BackMsg = ['files-list'] | ['file-content']
export type FrontMsg =
  | ['write-file']
  | ['move-file']
  | ['delete-file']
  | ['read-file']

function start() {
  const server = createWebsocketServer<FrontMsg, BackMsg>(
    (msg) => {
      switch (msg[0]) {
        case 'write-file':
        case 'move-file':
        case 'delete-file':
        case 'read-file':
      }
    },
    (sendMsg, ws) => {
      console.log('REMOTE ststst', ws.remoteAddress)
      // Send files list and updates
      return () => {}
    },
    WRAPPER_PORT,
    FILES_SERVER_PORT,
  )

  console.log('Files server started')

  return server
}

// export { start }

start()
