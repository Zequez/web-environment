import {
  SERVER_GIT_PORT,
  SERVER_PUBLISHING_PORT,
  SERVER_VITE_SPINNER_PORT,
} from '@/center/ports'
import type {
  BackMsg,
  FrontMsg,
  Repo,
} from '@/mainframe/servers/git-server/messages'
// import type {
//   BackMsg as PublishingBackMsg,
//   FrontMsg as PublishingFrontMsg,
// } from '@/mainframe/servers/publishing-server'

import type {
  BackMsg as ViteSpinnerBackMsg,
  FrontMsg as ViteSpinnerFrontMsg,
} from '@/mainframe/servers/vite-spinner/start.ts'

// import { type ElectronBridge } from '@/mainframe/electron/preload'
import { tunnel } from '@/center/tunnel'
import { onMount } from 'svelte'

export function init() {
  const electronAPI = (window as any).electronAPI

  let repos: Repo[] = $state<Repo[]>([])
  let gitSocket = $state<WebSocket>(null!)
  let publishingSocket = $state<WebSocket>(null!)
  let viteSpinnerSocket = $state<WebSocket>(null!)

  let mainframeRepo = $derived(repos.find((r) => !r.name) || null)
  let subRepos = $derived(repos.filter((r) => r.name))
  let runningViteServers = $state<{ [key: string]: string }>({})

  type RepoSyncStatus = 'ahead' | 'behind' | 'diverged' | 'in-sync' | 'unknown'

  onMount(() => {
    gitSocket = new WebSocket(`ws://localhost:${SERVER_GIT_PORT}`)
    publishingSocket = new WebSocket(`ws://localhost:${SERVER_PUBLISHING_PORT}`)
    viteSpinnerSocket = new WebSocket(
      `ws://localhost:${SERVER_VITE_SPINNER_PORT}`,
    )

    gitSocket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as BackMsg
        console.log('[GIT] 🔻', data)
        switch (data[0]) {
          case 'repos-list': {
            repos = data[1]
          }
        }
      } catch (e) {
        console.log('Invalid data', e)
        return
      }
      console.log(`Socket message!`, event.data)
    })

    viteSpinnerSocket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as ViteSpinnerBackMsg
        console.log('[VITE SPINNER] 🔻', data)
        switch (data[0]) {
          case 'servers': {
            runningViteServers = data[1]
          }
        }
      } catch (e) {
        console.log('Invalid data', e)
        return
      }
    })
  })

  function gitSend(msg: FrontMsg) {
    gitSocket.send(JSON.stringify(msg))
  }

  function viteSpinnerSend(msg: ViteSpinnerFrontMsg) {
    viteSpinnerSocket.send(JSON.stringify(msg))
  }

  async function cmd(
    ...c:
      | [type: 'add-repo', name: string]
      | [type: 'init-repo-git', name: string]
      | [type: 'remove-repo', name: string]
      | [type: 'add-remote', name: string, url: string]
      | [type: 'sync', name: string | null]
      | [type: 'fetch', name: string | null]
      | [type: 'build', name: string]
      | [type: 'publish', name: string]
      | [type: 'toggle-vite', name: string]
      | [type: 'start-vite', name: string]
      | [type: 'stop-vite', name: string]
  ) {
    switch (c[0]) {
      case 'add-repo': {
        gitSend(['add-repo', c[1]])
        break
      }
      case 'init-repo-git': {
        gitSend(['init-repo-git', c[1]])
        break
      }
      case 'remove-repo': {
        if (confirm('Repo will be moved to trash')) {
          gitSend(['remove-repo', c[1]])
        }
        break
      }
      case 'add-remote': {
        gitSend(['add-remote', c[1], c[2]])
        break
      }
      case 'sync': {
        gitSend(['sync', c[1]])
        break
      }
      case 'fetch': {
        gitSend(['fetch', c[1]])
        break
      }
      case 'build': {
        await tunnel('mainframe/tunnels/publishing.ts/buildRepo', c[1])
        // viteSpinnerSend(['build', c[1]])
        break
      }
      case 'publish': {
        await tunnel('mainframe/tunnels/publishing.ts/publishRepo', c[1])
        break
      }
      case 'toggle-vite': {
        if (runningViteServers[c[1]]) {
          viteSpinnerSend(['stop', c[1]])
        } else {
          viteSpinnerSend(['start', c[1]])
        }
        break
      }
      case 'start-vite': {
        viteSpinnerSend(['start', c[1]])
        break
      }
      case 'stop-vite': {
        viteSpinnerSend(['stop', c[1]])
        break
      }
    }
  }

  function openOnFileExplorer(name: string | null) {
    electronAPI.openFolder(name)
  }

  function mainframeAction() {
    if (mainframeRepo && mainframeRepo.status[0] === 'git-full') {
      const syncStatus = mainframeRepo.status[2]
      if (syncStatus === 'behind') {
        cmd('sync', null)
      } else {
        cmd('fetch', null)
      }
    }
  }

  return {
    cmd,
    get runningViteServers() {
      return runningViteServers
    },
    get repos() {
      return repos
    },
    get subRepos() {
      return subRepos
    },
    get mainframeRepo() {
      return mainframeRepo
    },
  }
}
