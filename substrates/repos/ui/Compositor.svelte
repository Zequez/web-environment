<script lang="ts">
  import { onMount } from 'svelte'
  import { cx } from '@/center/utils'
  import LeftArrowIcon from '~icons/fa6-solid/arrow-left'
  import FolderIcon from '~icons/fa6-solid/folder-open'
  import InternetIcon from '~icons/fa6-solid/globe'
  import TrashIcon from '~icons/fa6-solid/trash'
  import OpenIcon from '~icons/fa6-solid/square-arrow-up-right'
  import UploadIcon from '~icons/fa6-solid/upload'

  import AddRepoInput from './AddRepoInput.svelte'
  import { SERVER_GIT_PORT } from '../../../center/ports'
  import type {
    BackMsg,
    FrontMsg,
    Repo,
  } from '@/back/servers/git-server/messages'
  import AddRemoteInput from './AddRemoteInput.svelte'
  import { type ElectronBridge } from '@/back/electron/preload'
  import SyncButton from './SyncButton.svelte'
  import FetchedButton from './FetchedButton.svelte'
  import GitRemoteDisplay from './GitRemoteDisplay.svelte'

  const electronAPI = (window as any).electronAPI as ElectronBridge

  let repos: Repo[] = $state<Repo[]>([])
  let socket = $state<WebSocket>(null!)

  let mainframeRepo = $derived(repos.find((r) => !r.name) || null)
  let subRepos = $derived(repos.filter((r) => r.name))

  type RepoSyncStatus = 'ahead' | 'behind' | 'diverged' | 'in-sync' | 'unknown'

  onMount(() => {
    socket = new WebSocket(`ws://localhost:${SERVER_GIT_PORT}`)

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as BackMsg
        console.log('🔻', data)
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
  })

  function send(msg: FrontMsg) {
    socket.send(JSON.stringify(msg))
  }

  function cmd(
    ...c:
      | [type: 'add-repo', name: string]
      | [type: 'init-repo-git', name: string]
      | [type: 'remove-repo', name: string]
      | [type: 'add-remote', name: string, url: string]
      | [type: 'sync', name: string | null]
      | [type: 'fetch', name: string | null]
  ) {
    switch (c[0]) {
      case 'add-repo': {
        send(['add-repo', c[1]])
        break
      }
      case 'init-repo-git': {
        send(['init-repo-git', c[1]])
        break
      }
      case 'remove-repo': {
        if (confirm('Repo will be moved to trash')) {
          send(['remove-repo', c[1]])
        }
        break
      }
      case 'add-remote': {
        send(['add-remote', c[1], c[2]])
        break
      }
      case 'sync': {
        send(['sync', c[1]])
        break
      }
      case 'fetch': {
        send(['fetch', c[1]])
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
</script>

{#snippet MiniBtn(text: string, onClick: () => void)}
  <button
    class="flexcs bg-black/10 b font-semibold b-black/10 hover:bg-black/20 h4 px1 rounded-sm text-[10px] uppercase text-black/80"
    onclick={onClick}
  >
    {text}
  </button>
{/snippet}

<div class="flex flex-col h-full">
  <!-- MAINFRAME BAR -->
  <div
    class="flex bg-[hsl(129deg_34%_42%_/_100%)] bg-gradient-to-r from-#0001 to-#0000"
  >
    <button
      onclick={() => openOnFileExplorer(null)}
      class="w12 h12 relative flex-shrink-0 overflow-hidden b-2.5
      b-[hsl(9_4%_39%_/_1)] group"
    >
      <div
        class="shadow-[inset_0_0_10px_0_#0002,inset_0_1px_1px_2px_#0003] absolute size-full z-20"
      ></div>
      <img
        alt="Evironment icon"
        class="scale-300 saturate-10 group-hover:saturate-120 transition-all hue-rotate-290 relative z-10"
        src="/dock-icon.png"
      />
    </button>
    <div
      class="flex-grow py1 px2 b-b-2.5 b-[hsl(9_4%_39%_/_1)] shadow-[inset_10px_0_50px_0_#0005]"
    >
      <div class="h2/3 bg-blu-500 text-white/90 text-shadow-[0_1px_0px_#0005]">
        Environment by <a href="https://ezequielshwartzman.org">
          Ezequiel Schwartzman
        </a>
      </div>
      <div class="h1/3 bg-gren-300 flex">
        {#if mainframeRepo && mainframeRepo.status[0] === 'git-full'}
          {@const syncStatus = mainframeRepo.status[2]}
          <div class="relative">
            <button
              class={cx(
                'bg-white hover:bg-green-2 active:(top-1px shadow-none) relative group shadow-[0_1px_1px_0.5px_#0009] flexcc rounded-sm px1 text-[8px] font-bold text-black/70 mr1 uppercase',
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
                  Local changes
                {:else if syncStatus === 'behind'}
                  Updates available
                {:else if syncStatus === 'diverged'}
                  Merge needed
                {/if}
              </span>
              <span class="hidden group-hover:flexcc absolute size-full">
                {#if syncStatus === 'behind'}
                  Apply
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
          <span class="text-[10px] mx1 text-white">
            <LeftArrowIcon />
          </span>

          <button
            class="group flexcs"
            onclick={electronAPI.openExternal.bind(
              null,
              mainframeRepo.status[1],
            )}
          >
            <GitRemoteDisplay url={mainframeRepo.status[1]} />
          </button>
        {/if}
      </div>
    </div>
  </div>
  <!-- <div class="h12 bg-gray-900"></div> -->
  <!-- REPOS LIST -->
  <div class="flex-grow">
    {#each subRepos as repo (repo.name)}
      {@const syncStatus =
        repo.status[0] === 'git-full' ? repo.status[2] : null}
      <div
        class={cx(
          'flexcc space-x-4 bg-gray-200 hover:bg-gray-300 b-b b-gray-300 h8',
        )}
      >
        <button
          onclick={() => electronAPI.openView(repo.name)}
          class="uppercase h-full flexcs px2 bg-gray-700 hover:bg-gray-600 text-white font-semibold text-xs w30 flex-shrink-0 overflow-hidden text-ellipsis"
        >
          {repo.name}
        </button>
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
          <button
            class="group flexcs"
            onclick={electronAPI.openExternal.bind(null, repo.status[1])}
          >
            <GitRemoteDisplay url={repo.status[1]} />
          </button>
        {/if}

        {#if repo.name}
          <div class="flex space-x-1">
            {@render MiniBtn('Filesystem', () => openOnFileExplorer(repo.name))}
            {@render MiniBtn('Open', () => electronAPI.openView(repo.name))}
            {@render MiniBtn('Build', () => {})}
            {@render MiniBtn('Publish', () => {})}
            {@render MiniBtn('Remove', () => cmd('remove-repo', repo.name!))}
          </div>
        {/if}
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
