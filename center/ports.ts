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

let port = BASE_PORT
const mkport = () => {
  port++
  return port
}

export const MAINFRAME_UI_PORT = mkport()
export const SERVER_GIT_PORT = mkport()
export const SERVER_FILES_PORT = mkport()
export const SERVER_PUBLISHING_PORT = mkport()
export const SERVER_VITE_SPINNER_PORT = mkport()
export const SERVER_TUNNEL_PORT = mkport()

export const REPOS_PORT_BASE = mkport() + 10
