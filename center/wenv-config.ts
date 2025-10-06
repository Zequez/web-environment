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

export function readRepoWenvConfig(repo: string): WEnvConfig {
  const content = fs.readFileSync(`./repos/${repo}/wenv.yml`, 'utf-8')
  if (content) {
    return parse(content) as WEnvConfig
  } else {
    return {}
  }
}
