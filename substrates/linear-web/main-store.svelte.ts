import chalk from 'chalk'
import createContextedStore, { proxifyCmd } from '@/center/contexted-store'
import type { WebConfig } from './WebConfig.ts'

export default createContextedStore('main', (initialConfig: WebConfig) => {
  let optimizeVisuals = $state(false)
  let activeSection = $state(initialConfig.sections[0]?.id || null)
  let config = $state(initialConfig)

  const cmd = {}

  const cmdProxy = proxifyCmd(chalk.cyan('[CMD]'), cmd)

  return {
    cmd: cmdProxy,
    get optimizeVisuals() {
      return optimizeVisuals
    },
    get config() {
      return config
    },
    get activeSection() {
      return activeSection
    },
  }
})
