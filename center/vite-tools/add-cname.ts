import fs from 'node:fs'
import { $path } from '@/center/utils/system'
import { readRepoWenvConfig } from '../wenv-config'

export default function copyCname(repo: string) {
  return {
    name: 'add-cname',
    closeBundle() {
      const wenv = readRepoWenvConfig(repo)
      const dest = $path(`projections/${repo}/CNAME`)
      if (wenv.cname) {
        fs.writeFileSync(dest, wenv.cname)
      } else {
        const src = $path(`repos/${repo}/CNAME`)
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest)
        } else {
          console.warn(`⚠️ No CNAME resolved`)
        }
      }
    },
  }
}
