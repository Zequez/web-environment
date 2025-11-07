<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { cx } from '@/center/utils'
  import LeftArrowIcon from '~icons/fa6-solid/arrow-left'
  import PlayIcon from '~icons/fa6-solid/play'
  import StopIcon from '~icons/fa6-solid/stop'
  import FolderIcon from '~icons/fa6-solid/folder-open'
  import InternetIcon from '~icons/fa6-solid/globe'
  import TrashIcon from '~icons/fa6-solid/trash'
  import OpenIcon from '~icons/fa6-solid/square-arrow-up-right'
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

  import AddRemoteInput from './AddRemoteInput.svelte'
  import { type ElectronBridge } from '@/mainframe/electron/preload'
  import SyncButton from './SyncButton.svelte'
  import FetchedButton from './FetchedButton.svelte'
  import GitRemoteDisplay from './GitRemoteDisplay2.svelte'
  import { tunnel } from '@/center/tunnel'
  import { lsState } from '@/center/utils/runes.svelte'

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
      | [type: 'rename-repo', name: string, newName: string]
      | [type: 'add-remote', name: string, url: string]
      | [type: 'sync', name: string | null]
      | [type: 'fetch', name: string | null]
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
      case 'rename-repo': {
        gitSend(['rename-repo', c[1], c[2]])
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
      cmd('rename-repo', isRenaming.from, isRenaming.to)
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
  <div class="flexcc bg-slate-500 bg-gradient-to-r from-#0001 to-#0000">
    <div class="flexcs h-12 space-x-3 px3">
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
              'bg-white hover:bg-lime-4 active:(top-1px shadow-none) relative group shadow-[0_1px_1px_0.5px_#0009] flexcc rounded-sm px1 text-3 font-bold text-black/70 mr1 uppercase',
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
    <div></div>
    <table class="w-full border-collapse">
      <tbody>
        {#each subRepos as repo (repo.name)}
          {@const syncStatus =
            repo.status[0] === 'git-full' ? repo.status[2] : null}
          <tr class="bg-gray-200 p-0 h8 last:(b-b-1 b-black/10)">
            <td
              class="h-full p0 pl2 pr1 bg-gray-700 b-t b-white/10 flexcc relative"
            >
              <div
                class="cursor-move font-mono h8 flexcs flex-grow text-white text-xs w30 flex-shrink-0 overflow-hidden text-ellipsis"
              >
                {repo.name}
              </div>
              {#if isRenaming && repo.name === isRenaming.from}
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
                  class="absolute flex flex-col whitespace-nowrap top-0 py1 text-black/75 right-0 mr8 mt1 bg-gray-200 b b-black/10 rounded-sm shadow-md z-100"
                  id="ellipsis-menu"
                >
                  <button
                    onclick={() => openOnFileExplorer(repo.name)}
                    class="block text-left px1 hover:bg-black/10"
                  >
                    Open Filesystem
                  </button>

                  <button
                    onclick={() => startRenaming(repo.name!)}
                    class="block text-left px1 hover:bg-black/10"
                  >
                    Rename
                  </button>
                  <button
                    onclick={() => cmd('duplicate-repo', repo.name!)}
                    class="block text-left px1 hover:bg-black/10"
                  >
                    Duplicate
                  </button>
                  <button
                    onclick={() => cmd('remove-repo', repo.name!)}
                    class="block text-left px1 hover:bg-black/10"
                  >
                    Delete
                  </button>
                </div>
              {/if}
            </td>
            <td class="p0 pl1">
              <div class={cx('flexcc space-x-4 h8 pr1')}>
                <div class="rounded-md flexcc relative">
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
                <FetchedButton
                  lastFetchedAt={repo.lastFetchedAt}
                  isFetching={repo.fetching}
                  onFetch={() => cmd('fetch', repo.name)}
                />
                <div class="flex-grow"></div>

                {#if repo.status[0] === 'git'}
                  <AddRemoteInput
                    onConfirm={(url) => cmd('add-remote', repo.name!, url)}
                  />
                {:else if repo.status[0] === 'git-full'}
                  <GitRemoteDisplay url={repo.status[1]} />
                {/if}
              </div>
            </td>
            <td class="p0 pl1 b-l b-black/10">
              {#if repo.name}
                {@const btnClass =
                  'whitespace-nowrap flexcc bg-black/10 rounded-sm text-xs text-black/80 px1 py0.5 hover:bg-black/20'}
                <div class="flexcs space-x-1">
                  <div
                    class={cx('h5 w5 b b-black/10 rounded-full', {
                      'bg-green-500': runningViteServers[repo.name],
                      'bg-gray-500': !runningViteServers[repo.name],
                    })}
                  ></div>
                  {#if !runningViteServers[repo.name]}
                    <button
                      class={btnClass}
                      onclick={() => cmd('start-vite', repo.name!)}
                    >
                      <PlayIcon class="mr1" /> Start
                    </button>
                  {:else}
                    <button
                      class={btnClass}
                      onclick={() => cmd('stop-vite', repo.name!)}
                    >
                      <StopIcon class="mr1" /> Stop
                    </button>
                    <a
                      href={runningViteServers[repo.name]}
                      onclick={(ev) => {
                        ev.preventDefault()
                        electronAPI.openExternal(runningViteServers[repo.name!])
                      }}
                      class="bg-gray-300 hover:bg-black/20 text-black/80 text-xs rounded-sm px1 py0.5"
                    >
                      {runningViteServers[repo.name]}
                    </a>
                  {/if}
                </div>
              {/if}
            </td>
            <td class="p0 pl1 b-l b-black/10">
              {#if repo.name}
                <div class="flex space-x-1">
                  {@render MiniBtn('Build', () => cmd('build', repo.name!))}
                  {@render MiniBtn('Publish', () => cmd('publish', repo.name!))}
                </div>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <!-- ADD REPO INPUT -->
  <div class="p2">
    <AddRepoInput
      takenNames={repos.filter((r) => r.name).map((r) => r.name!)}
      onConfirm={(name) => cmd('add-repo', name)}
    />
  </div>
</div>
