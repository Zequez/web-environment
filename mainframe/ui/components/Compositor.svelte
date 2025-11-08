<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { cx } from '@/center/utils'
  import LeftArrowIcon from '~icons/fa6-solid/arrow-left'
  import PlayIcon from '~icons/fa6-solid/play'
  import StopIcon from '~icons/fa6-solid/stop'
  import FolderIcon from '~icons/fa6-solid/folder-open'
  import ChangeIcon from '~icons/fa6-solid/file-invoice'
  import InternetIcon from '~icons/fa6-solid/globe'
  import TrashIcon from '~icons/fa6-solid/trash'
  import OpenIcon from '~icons/fa6-solid/square-arrow-up-right'
  import PowerIcon from '~icons/fa6-solid/power-off'
  import UploadIcon from '~icons/fa6-solid/upload'
  import EllipsisVerticalIcon from '~icons/fa6-solid/ellipsis-vertical'

  import AddRepoInput from './AddRepoInput.svelte'
  import {
    SERVER_GIT_PORT,
    SERVER_PUBLISHING_PORT,
    SERVER_VITE_SPINNER_PORT,
  } from '../../../center/ports'
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

  import { tooltip } from '@/center/svooltip'
  import AddRemoteInput from './AddRemoteInput.svelte'
  import { type ElectronBridge } from '@/mainframe/electron/preload'
  import SyncButton from './SyncButton.svelte'
  import FetchedButton from './FetchedButton.svelte'
  import GitRemoteDisplay from './GitRemoteDisplay2.svelte'
  import { tunnel } from '@/center/tunnel'
  import { lsState } from '@/center/utils/runes.svelte'
  import SetupRemote from './SetupRemote.svelte'
  import NiftyInput from './NiftyInput.svelte'
  import UncommittedChangesLogger from './UncommittedChangesLogger.svelte'
  import NiftyBtn from './NiftyBtn.svelte'
  import BootToggle from './BootToggle.svelte'
  import LocalhostLink from './LocalhostLink.svelte'
  import { openInBrowser, openOnFileExplorer } from '../electron-bridge'
  import MoveThingy from './MoveThingy.svelte'
  import CompRepo from './CompRepo.svelte'

  const electronAPI = (window as any).electronAPI as ElectronBridge

  let repos: Repo[] = $state<Repo[]>([])
  let gitSocket = $state<WebSocket>(null!)
  let publishingSocket = $state<WebSocket>(null!)
  let viteSpinnerSocket = $state<WebSocket>(null!)

  let mainframeRepo = $derived(repos.find((r) => !r.name) || null)
  let reposOrder = lsState<{ v: string[][] }>('repos-order5', { v: [[]] })
  let subRepos: Repo[] = $derived(repos.filter((r) => r.name))

  // $derived.by(() => {
  //   const r = repos.filter((r) => r.name)
  //   return reposOrder.v
  //     .map((name) => r.find((r) => r.name === name))
  //     .filter((r) => r) as Repo[]
  // })
  let runningViteServers = $state<{ [key: string]: string }>({})
  let isRenaming = $state<{ from: string; to: string } | null>(null)

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
            data[1].forEach((repo: Repo) => {
              if (!repo.name) return
              let found = false
              for (let col of reposOrder.v) {
                if (col.indexOf(repo.name!) !== -1) {
                  found = true
                  break
                }
              }

              if (!found) {
                reposOrder.v[0].push(repo.name!)
              }
            })
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
      | [type: 'duplicate-repo', name: string]
      | [type: 'remove-remote', name: string]
      | [type: 'rename-repo', name: string, newName: string]
      | [type: 'commit', name: string, message: string]
      | [type: 'add-remote', name: string, url: string]
      | [type: 'sync', name: string | null]
      | [type: 'fetch', name: string | null]
      | [type: 'fetch-all']
      | [type: 'analyze-all']
      // ---
      | [type: 'build', name: string]
      | [type: 'publish', name: string]
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
      case 'duplicate-repo': {
        gitSend(['duplicate-repo', c[1]])
        break
      }
      case 'remove-remote': {
        gitSend(['remove-remote', c[1]])
        break
      }
      case 'rename-repo': {
        gitSend(['rename-repo', c[1], c[2]])
        break
      }
      case 'add-remote': {
        gitSend(['add-remote', c[1], c[2]])
        break
      }
      case 'commit': {
        gitSend(['commit', c[1], c[2]])
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
      case 'fetch-all': {
        gitSend(['fetch-all'])
        break
      }
      case 'analyze-all': {
        gitSend(['analyze-all'])
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

  let ellipsisMenuOpen = $state<string | null>(null)
  async function openEllipsisMenu(repo: string) {
    setTimeout(() => {
      ellipsisMenuOpen = repo
    })
  }

  function handleWindowClickWhileMenuOpen(ev: MouseEvent) {
    if (ellipsisMenuOpen) {
      ellipsisMenuOpen = null
    }
  }

  function moveRepo(repo: string, direction: 'up' | 'down' | 'left' | 'right') {
    let i = -1
    let j = -1
    for (let k = 0; k < reposOrder.v.length; k++) {
      const l = reposOrder.v[k].indexOf(repo)
      if (reposOrder.v[k].indexOf(repo) !== -1) {
        i = k
        j = l
        break
      }
    }

    if (i === -1 || j === -1) {
      return
    }

    if (direction === 'down' || direction === 'up') {
      let col = [...reposOrder.v[i]]
      if (direction === 'down') {
        if (j === col.length - 1) {
          return
        }
        const [bef, aft] = col.splice(j, 2)
        col.splice(j, 0, aft, bef)
      } else {
        if (j === 0) {
          return
        }
        const [bef, aft] = col.splice(j - 1, 2)
        col.splice(j - 1, 0, aft, bef)
      }
      reposOrder.v[i] = col
    }

    if (direction === 'left' || direction === 'right') {
      let colFrom = [...reposOrder.v[i]]

      if (direction === 'left') {
        if (i === 0) {
          return
        }
        const [repoName] = colFrom.splice(j, 1)
        reposOrder.v.splice(i, 1, colFrom)
        let colTo = [...reposOrder.v[i - 1]]
        colTo.push(repoName)
        reposOrder.v.splice(i - 1, 1, colTo)
      } else if (direction === 'right') {
        const [repoName] = colFrom.splice(j, 1)
        reposOrder.v.splice(i, 1, colFrom)
        if (i === reposOrder.v.length - 1) {
          reposOrder.v.push([repoName])
        } else {
          let colTo = [...reposOrder.v[i + 1]]
          colTo.push(repoName)
          reposOrder.v.splice(i + 1, 1, colTo)
        }
      }
    }
  }

  $inspect(reposOrder)
</script>

<svelte:window
  on:click={ellipsisMenuOpen ? handleWindowClickWhileMenuOpen : null}
/>

<div class="flex flex-col h-full">
  <!-- MAINFRAME BAR -->
  <div class="flexcs h12 px3 bg-slate-500 bg-gradient-to-r from-#0001 to-#0000">
    <div class="flex space-x-3">
      <NiftyBtn onclick={() => cmd('analyze-all')}>Analyze All</NiftyBtn>
      <NiftyBtn onclick={() => cmd('fetch-all')}>Fetch All</NiftyBtn>
    </div>
    <div class="flexcs h-12 space-x-1.5 px3">
      <button
        onclick={() => openOnFileExplorer(null)}
        class="w6 h6 flexcc text-white hover:text-lime-400 p1"
      >
        <FolderIcon />
      </button>
      {#if mainframeRepo && mainframeRepo.status[0] === 'git-full'}
        {@const syncStatus = mainframeRepo.status[2]}
        <div class="relative">
          <button
            class={cx(
              'bg-white hover:bg-lime-4 font-mono active:(top-1px shadow-none) relative group shadow-[0_1px_1px_0.5px_#0009] flexcc rounded-sm px1 text-3 text-black/70 mr1 uppercase',
              {
                'opacity-0': mainframeRepo.fetching,
              },
            )}
            disabled={mainframeRepo.fetching}
            onclick={mainframeAction}
          >
            <span class="group-hover:opacity-0">
              {#if syncStatus === 'in-sync'}
                Up to date
              {:else if syncStatus === 'ahead'}
                Local changes detected
              {:else if syncStatus === 'behind'}
                Updates available
              {:else if syncStatus === 'diverged'}
                Merge needed
              {/if}
            </span>
            <span class="hidden group-hover:flexcc absolute size-full">
              {#if syncStatus === 'behind'}
                Apply update
              {:else}
                Refresh
              {/if}
            </span>
          </button>
          {#if mainframeRepo.fetching}
            <div class="absolute size-full top-0 flexcc text-8px text-white">
              FETCHING...
            </div>
          {/if}
        </div>

        <GitRemoteDisplay url={mainframeRepo.status[1]} />
      {/if}
    </div>
  </div>
  <!-- REPOS LIST -->
  <div class="flex-grow flex">
    {#each reposOrder.v as col, i (i)}
      <div class="flex flex-col w-320px flex-shrink-0 space-y-1.5 p1.5">
        {#each col as repoName, j (j)}
          {@const repo = subRepos.find((r) => r.name === repoName)}
          {#if repo}
            {@const name = repo.name!}
            <CompRepo
              {repo}
              isRunning={runningViteServers[name]}
              menuOpen={name === ellipsisMenuOpen}
              onToggleBoot={() => {
                if (runningViteServers[name]) {
                  cmd('stop-vite', name)
                } else {
                  cmd('start-vite', name)
                }
              }}
              onClickMenu={() => openEllipsisMenu(name)}
              onRename={(newName) => cmd('rename-repo', name, newName)}
              onRemoveRemote={() => cmd('remove-remote', name)}
              onDuplicate={() => cmd('duplicate-repo', name)}
              onRemove={() => cmd('remove-repo', name)}
              onCommit={(msg) => cmd('commit', name, msg)}
              onAddRemote={(url) => cmd('add-remote', name, url)}
              onFetch={() => cmd('fetch', name)}
              onSync={() => cmd('sync', name)}
              onBuild={() => cmd('build', name)}
              onPublish={() => cmd('publish', name)}
              onMove={(direction) => moveRepo(name, direction)}
            />
          {/if}
        {/each}
      </div>
    {/each}
  </div>
  <!-- ADD REPO INPUT -->
  <div class="p2">
    <AddRepoInput
      takenNames={repos.filter((r) => r.name).map((r) => r.name!)}
      onConfirm={(name) => cmd('add-repo', name)}
    />
  </div>
</div>
