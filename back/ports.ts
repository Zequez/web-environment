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

export const VITE_PORT = stringToPort(name) // 18214
export const UPLINK_PORT = VITE_PORT + 1
export const AI_PORT = VITE_PORT + 2
