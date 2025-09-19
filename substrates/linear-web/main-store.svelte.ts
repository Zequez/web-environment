import chalk from 'chalk'
import createContextedStore, { proxifyCmd } from '@/center/contexted-store'
import type { WebConfig } from './WebConfig.ts'
import { onMount } from 'svelte'
import { debounce } from '@/center/utils/neutral'
import { getLocationHash } from '@/center/utils'

export default createContextedStore('main', (initialConfig: WebConfig) => {
  const initialHash = getLocationHash()
  let optimizeVisuals = $state(false)
  let activeSection = $state(
    initialHash || initialConfig.sections[0]?.id || null,
  )
  let config = $state(initialConfig)
  type Position = { section: string; progress: number } | null
  let position = $state<Position>(null)

  onMount(() => {
    window.addEventListener('hashchange', (ev) => {
      activeSection = getLocationHash() || null
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

  const cmd = {
    setPosition(pos: Position) {
      position = pos
    },
  }

  let prevPosition: Position = null
  $effect(() => {
    // maybeUpdateActive(position)
    debouncedMaybeUpdateActive(position)
  })

  function maybeUpdateActive(newPos: Position) {
    if (
      (prevPosition === null && newPos !== null) ||
      (prevPosition !== null && newPos === null) ||
      prevPosition!.section !== newPos!.section
    ) {
      activeSection = newPos ? newPos.section : null
      prevPosition = newPos
    }
  }

  const debouncedMaybeUpdateActive = debounce(maybeUpdateActive, 50)

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
    get position() {
      return position
    },
  }
})
