import { name } from '../package.json'

function stringToPort(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }

  const minPort = 4000
  const maxPort = 49151
  return minPort + (Math.abs(hash) % (maxPort - minPort))
}

const BASE_PORT = stringToPort(name) // 18214
export const VITE_PORT = BASE_PORT + 0
export const UPLINK_PORT = BASE_PORT + 1
export const WRAPPER_PORT = BASE_PORT + 2
export const FILES_SERVER_PORT = BASE_PORT + 3
