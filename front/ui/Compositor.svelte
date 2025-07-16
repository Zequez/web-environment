<script lang="ts">
  import { onMount } from 'svelte'
  import { cx } from '@/center/utils'
  import FolderIcon from '~icons/fa6-solid/folder-open'
  import InternetIcon from '~icons/fa6-solid/globe'
  import TrashIcon from '~icons/fa6-solid/trash'

  import AddRepoInput from './AddRepoInput.svelte'
  import { UPLINK_PORT } from '../../back/ports'
  import type {
    BackMsg,
    FrontMsg,
    Repo,
    SyncStatus,
  } from '@back/uplink/messages'
  import AddRemoteInput from './AddRemoteInput.svelte'
  import { type ElectronBridge } from '@back/electron/preload'
  import SyncButton from './SyncButton.svelte'

  const electronAPI = (window as any).electronAPI as ElectronBridge

  let repos: Repo[] = $state<Repo[]>([])
  let repos2: Repo2[] = $state<Repo2[]>([])
  let socket = $state<WebSocket>(null!)

  type Repo2 = {
    remote: string
    name: string | null
    syncStatus: RepoSyncStatus
  }

  type RepoSyncStatus = 'ahead' | 'behind' | 'diverged' | 'in-sync' | 'unknown'

  onMount(() => {
    socket = new WebSocket(`ws://localhost:${UPLINK_PORT}`)

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

    // setTimeout(() => {
    //   socket.send('ping')
    // }, 1000)
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
    }
  }

  function openOnFileExplorer(name: string | null) {
    electronAPI.openFolder(name)
  }

  // function setRepo(name: string, {title: string, name: string, remote: string}) {

  // }

  // function setRepoConfig(name: string) {

  // }

  // onMount(() => {
  //   repos2 = [
  //     {
  //       remote: 'https://github.com/zequez/web-environment',
  //       name: null,
  //       syncStatus: 'unknown',
  //     },
  //     {
  //       remote: 'https://github.com/zequez/ezequielschwartzman.org',
  //       name: 'ezequiel',
  //       syncStatus: 'unknown',
  //     },

  //     {
  //       remote: 'https://github.com/zequez/chloe',
  //       name: 'chloe',
  //       syncStatus: 'unknown',
  //     },
  //   ]
  // })
</script>

<!--
{#if showAddRepo}
  <AddRepoDialog onCancel={() => (showAddRepo = false)} />
{/if} -->
<div class="">
  {#each repos as repo}
    {@const syncStatus = repo.status[0] === 'git-full' ? repo.status[2] : null}
    <div
      class={cx('flex space-x-4 mb2 px2', {
        'b-b-1 py2 bg-gray-200': !repo.name,
      })}
    >
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
        <!-- {#if !syncStatus}
          <span></span>
        {:else if syncStatus === 'ahead'}
          <span title="Ahead" class="whitespace-nowrap">🔼</span>
        {:else if syncStatus === 'behind'}
          <span title="Behind" class="whitespace-nowrap">🔻</span>
        {:else if syncStatus === 'diverged'}
          <span title="Diverged">⚠️</span>
        {:else if syncStatus === 'in-sync'}
          <span title="In-sync">✅</span>
        {:else}
          <span title="Unknown">❓</span>
        {/if} -->
      </div>
      <button
        class="flex-grow flexcs hover:text-blue-5"
        onclick={() => openOnFileExplorer(repo.name)}
      >
        <FolderIcon class="mr2" />
        {repo.name ? repo.name : '(mainframe)'}
      </button>

      {#if repo.status[0] === 'dir'}
        <button
          onclick={() => cmd('init-repo-git', repo.name!)}
          class="bg-green-500 text-white px1 rounded-md"
        >
          Initialize repo
        </button>
      {:else if repo.status[0] === 'git'}
        <AddRemoteInput
          onConfirm={(url) => cmd('add-remote', repo.name!, url)}
        />
      {:else if repo.status[0] === 'git-full'}
        <button
          class="text-blue-4 hover:text-blue-5 underline flexcs"
          onclick={electronAPI.openExternal.bind(null, repo.status[1])}
        >
          <InternetIcon class="mr2" />
          {repo.status[1].replace('https://', '')}
        </button>
      {/if}

      {#if repo.name}
        <button
          class="flexcs hover:text-red-5"
          onclick={() => cmd('remove-repo', repo.name!)}
        >
          <TrashIcon />
        </button>
      {/if}
    </div>
  {/each}
  <div class="p2">
    <AddRepoInput
      takenNames={repos.filter((r) => r.name).map((r) => r.name!)}
      onConfirm={(name) => cmd('add-repo', name)}
    />
  </div>
</div>
