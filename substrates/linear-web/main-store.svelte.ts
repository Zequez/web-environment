import chalk from 'chalk'
import createContextedStore, { proxifyCmd } from '@/center/contexted-store'
import type { WebConfig } from './WebConfig.ts'
import { onMount } from 'svelte'

export default createContextedStore('main', (initialConfig: WebConfig) => {
  const initialHash = window.location.hash.slice(1)
  let optimizeVisuals = $state(false)
  let activeSection = $state(
    initialHash || initialConfig.sections[0]?.id || null,
  )
  let config = $state(initialConfig)

  onMount(() => {
    window.addEventListener('hashchange', (ev) => {
      activeSection = window.location.hash.slice(1)
    })

    if (initialHash) {
      const el = document.getElementById(initialHash)
      if (el) {
        el.scrollIntoView({
          behavior: 'instant',
        })
      }
    }
  })

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
