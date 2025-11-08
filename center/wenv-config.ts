import fs from 'node:fs'
import { parse } from 'yaml'

export type WEnvConfig = {
  cname?: string
  substrate?: string
  fonts?: {
    sans?: string
    serif?: string
    mono?: string
  }
}

let defaultConfig = {
  substrate: 'nothing-web',
}

export function readRepoWenvConfig(repo: string): WEnvConfig {
  if (fs.existsSync(`./repos/${repo}/wenv.yml`)) {
    const contentRaw = fs.readFileSync(`./repos/${repo}/wenv.yml`, 'utf-8')
    if (contentRaw) {
      return parse(contentRaw) as WEnvConfig
    } else {
      console.log('Warning wenv.yml is empty, using default values')
      return defaultConfig
    }
  } else {
    console.log('Warning no wenv.yml found, using default values')
    return defaultConfig
  }
}
