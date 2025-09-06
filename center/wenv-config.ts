import fs from 'node:fs'
import { parse } from 'yaml'

export function readRepoWenvConfig(repo: string) {
  const content = fs.readFileSync(`./repos/${repo}/wenv.yml`, 'utf-8')
  if (content) {
    return parse(content)
  } else {
    return {}
  }
}
