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

export const UI_REPOS_PORT = mkport()
export const SERVER_GIT_PORT = mkport()
export const SERVER_FILES_PORT = mkport()
export const SERVER_VITE_SPINNER_PORT = mkport()

// Actually this should return the same port independently of usage order
// Proposal:
// Reserve 1000 ports space
// Using the repo string generate a hash and map it to a port
// 2 repos CANNOT share the same port
const REPOS_PORT_BASE = mkport()
let repos: string[] = []
export const UI_PORT_FOR_REPO = (repo: string) => {
  if (!repos.includes(repo)) {
    repos.push(repo)
  }
  return REPOS_PORT_BASE + repos.indexOf(repo)
}
