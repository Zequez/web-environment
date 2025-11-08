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

  const electronAPI = (window as any).electronAPI as ElectronBridge

  let repos: Repo[] = $state<Repo[]>([])
  let gitSocket = $state<WebSocket>(null!)
  let publishingSocket = $state<WebSocket>(null!)
  let viteSpinnerSocket = $state<WebSocket>(null!)

  let mainframeRepo = $derived(repos.find((r) => !r.name) || null)
  let reposOrder = lsState<{ v: string[] }>('repos-order', { v: [] })
  let subRepos: Repo[] = $derived.by(() => {
    const r = repos.filter((r) => r.name)
    console.log(r)
    return reposOrder.v
      .map((name) => r.find((r) => r.name === name))
      .filter((r) => r) as Repo[]
  })
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
              if (reposOrder.v.indexOf(repo.name!) === -1) {
                reposOrder.v.push(repo.name)
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

  async function startRenaming(repo: string) {
    isRenaming = {
      from: repo,
      to: repo,
    }
    await tick()
    document.getElementById('rename-input')!.focus()
  }

  function doneRenaming() {
    if (isRenaming) {
      if (isRenaming.from !== isRenaming.to) {
        cmd('rename-repo', isRenaming.from, isRenaming.to)
      }
      isRenaming = null
    }
  }
</script>

{#snippet MiniBtn(text: string, onClick: () => void)}
  <button
    class="flexcs bg-black/10 b font-semibold b-black/10 hover:bg-black/20 h4 px1 rounded-sm text-[10px] uppercase text-black/80"
    onclick={onClick}
  >
    {text}
  </button>
{/snippet}

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
  <div class="flex-grow">
    <div class="flex flex-col space-y-1.5 p1.5">
      {#each subRepos as repo (repo.name)}
        {@const syncStatus =
          repo.status[0] === 'git-full' ? repo.status[2] : null}
        {@const name = repo.name!}
        <div class="bg-gray-200 p-0 w-260px rounded-1 shadow-[0_0_0_1px_#0006]">
          <!-- HEADER -->
          <div
            class="bg-gray-700 rounded-t-1 flexcc relative px1.5 space-x-1.5"
          >
            <BootToggle
              status={runningViteServers[name] ? 'on' : 'off'}
              onclick={() => {
                if (runningViteServers[name]) {
                  cmd('stop-vite', name)
                } else {
                  cmd('start-vite', name)
                }
              }}
            />
            <div
              class="cursor-move font-mono h8 flexcs flex-grow text-white text-xs w30 flex-shrink-0 overflow-hidden text-ellipsis"
            >
              {name}
            </div>
            {#if isRenaming && name === isRenaming.from}
              <input
                type="text"
                bind:value={isRenaming.to}
                id="rename-input"
                onkeypress={(ev) => {
                  if (ev.key === 'Enter') {
                    doneRenaming()
                  } else if (ev.key === 'Escape') {
                    isRenaming = null
                  }
                }}
                onblur={() => doneRenaming()}
                class="absolute inset-1.5 right-8 bg-gray-800 b b-white/60 text-white font-mono text-3 outline-none"
              />
            {/if}
            <button
              onclick={() => openEllipsisMenu(repo.name!)}
              class="text-white/60 rounded-1 h6 w6 flexcc hover:(bg-white/10 text-white/80)"
            >
              <EllipsisVerticalIcon />
            </button>
            {#if ellipsisMenuOpen === repo.name}
              <div
                class="absolute flex flex-col whitespace-nowrap font-mono text-3 top-0 py1 text-black/75 left-full -ml1 mt1 bg-gray-200 b b-black/10 rounded-sm shadow-md z-100"
                id="ellipsis-menu"
              >
                <button
                  onclick={() => openOnFileExplorer(repo.name)}
                  class="block text-left px1.5 hover:bg-black/10"
                >
                  Open Filesystem
                </button>
                {#if repo.status[0] === 'git-full'}
                  <button
                    onclick={() => cmd('remove-remote', repo.name!)}
                    class="block text-left px1.5 hover:bg-black/10"
                  >
                    Remove Remote
                  </button>
                {/if}
                <button
                  onclick={() => startRenaming(repo.name!)}
                  class="block text-left px1.5 hover:bg-black/10"
                >
                  Rename
                </button>
                <button
                  onclick={() => cmd('duplicate-repo', repo.name!)}
                  class="block text-left px1.5 hover:bg-black/10"
                >
                  Duplicate
                </button>
                <button
                  onclick={() => cmd('remove-repo', repo.name!)}
                  class="block text-left px1.5 hover:bg-black/10"
                >
                  Delete
                </button>
              </div>
            {/if}
          </div>
          <div class="flex flex-col space-y-1.5 p1.5">
            <!-- VITE CONTROL -->
            {#if runningViteServers[name]}
              <LocalhostLink localUrl={runningViteServers[name]} />
            {/if}
            <!-- <div class="">
              <div class="flexcs space-x-1">
                {#if runningViteServers[repo.name!]}
                  <a
                    href={runningViteServers[repo.name!]}
                    onclick={(ev) => {
                      ev.preventDefault()
                      electronAPI.openExternal(runningViteServers[repo.name!])
                    }}
                    class="bg-gray-300 hover:bg-black/20 text-black/80 text-xs rounded-sm px1 py0.5"
                  >
                    {runningViteServers[repo.name!]}
                  </a>
                {/if}
              </div>
            </div> -->
            <!-- UNCOMMITTED CHANGES -->
            {#if repo.uncommittedChanges}
              <div class="">
                <UncommittedChangesLogger
                  onConfirm={(msg) => {
                    cmd('commit', repo.name!, msg)
                  }}
                  changes={repo.uncommittedChanges}
                />
              </div>
            {/if}
            <!-- GIT REMOTE -->
            {#if repo.status[0] === 'git'}
              <SetupRemote
                repoName={repo.name!}
                onConfirm={(url) => cmd('add-remote', repo.name!, url)}
              />
            {:else if repo.status[0] === 'git-full'}
              <GitRemoteDisplay url={repo.status[1]} />
              <div class="flexce relative">
                <FetchedButton
                  lastFetchedAt={repo.lastFetchedAt}
                  isFetching={repo.fetching}
                  onFetch={() => cmd('fetch', repo.name)}
                />
                <div class="flex-grow"></div>
                <SyncButton
                  status={syncStatus}
                  onAction={() => cmd('sync', repo.name)}
                />
                {#if repo.mergeConflicts}
                  <div
                    class="bg-red-500 inset-0 absolute rounded-md text-white z-50 text-xs flexcc"
                  >
                    Merge conflict
                  </div>
                {/if}
              </div>
            {/if}

            <!-- PUBLISHING -->
            {#if repo.wenv?.cname}
              <div class="">
                {#if repo.name}
                  <div class="flex space-x-1">
                    {@render MiniBtn('Build', () => cmd('build', repo.name!))}
                    {@render MiniBtn('Publish', () =>
                      cmd('publish', repo.name!),
                    )}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
  <!-- ADD REPO INPUT -->
  <div class="p2">
    <AddRepoInput
      takenNames={repos.filter((r) => r.name).map((r) => r.name!)}
      onConfirm={(name) => cmd('add-repo', name)}
    />
  </div>
</div>
