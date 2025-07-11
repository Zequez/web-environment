<script lang="ts">
  import { onMount } from 'svelte'
  import { cx } from '@/center/utils'
  import FolderIcon from '~icons/fa6-solid/folder-open'
  import InternetIcon from '~icons/fa6-solid/globe'
  import TrashIcon from '~icons/fa6-solid/trash'
  import AddRepoDialog from './AddRepoInput.svelte'
  import AddRepoInput from './AddRepoInput.svelte'
  import { UPLINK_PORT } from '../../back/ports'

  let repos: Repo[] = $state<Repo[]>([])
  let showAddRepo = $state(false)

  type Repo = {
    remote: string
    name: string | null
    syncStatus: RepoSyncStatus
  }

  type RepoSyncStatus =
    | 'local-updated'
    | 'remote-updated'
    | 'conflict'
    | 'synced'
    | 'unknown'

  $effect(() => {
    const socket = new WebSocket(`ws://localhost:${UPLINK_PORT}`)

    socket.addEventListener('message', (event) => {
      console.log(`Socket message!`, event.data)
    })

    setTimeout(() => {
      socket.send('ping')
    }, 1000)
  })

  function pollRepos() {
    // Remote call that retrieves all the repos and their sync status
  }

  function addRepo(name: string, remote: string) {
    console.log('Adding repo!', name, remote)
    showAddRepo = false
  }

  function removeRepo(name: string) {}

  function syncRepo(name: string) {}

  function renameRepo(name: string, newName: string) {}

  function changeRepoRemote(name: string, remote: string) {}

  function openOnFileExplorer(name: string | null) {
    ;(window as any).electronAPI.openFolder(name)
  }

  // function setRepo(name: string, {title: string, name: string, remote: string}) {

  // }

  // function setRepoConfig(name: string) {

  // }

  onMount(() => {
    repos = [
      {
        remote: 'https://github.com/zequez/web-environment',
        name: null,
        syncStatus: 'unknown',
      },
      {
        remote: 'https://github.com/zequez/ezequielschwartzman.org',
        name: 'ezequiel',
        syncStatus: 'unknown',
      },

      {
        remote: 'https://github.com/zequez/chloe',
        name: 'chloe',
        syncStatus: 'unknown',
      },
    ]
  })
</script>

<!--
{#if showAddRepo}
  <AddRepoDialog onCancel={() => (showAddRepo = false)} />
{/if} -->
<div class="">
  {#each repos as repo}
    <div
      class={cx('flex space-x-4 mb2 px2', {
        'b-b-1 py2 bg-gray-200': !repo.name,
      })}
    >
      <div class="rounded-md w6 h6 flexcc">
        {#if repo.syncStatus === 'local-updated'}
          <span title="Local updated">🟡⬆️</span>
        {:else if repo.syncStatus === 'remote-updated'}
          <span title="Local updated">🟡⬇️</span>
        {:else if repo.syncStatus === 'conflict'}
          <span title="Local updated">⚠️</span>
        {:else if repo.syncStatus === 'synced'}
          <span title="Local updated">🟢</span>
        {:else}
          <span title="Local updated">❓</span>
        {/if}
      </div>
      <button
        class="flex-grow flexcs hover:text-blue-5"
        onclick={() => openOnFileExplorer(repo.name)}
      >
        <FolderIcon class="mr2" />
        {repo.name ? `/${repo.name}` : '(mainframe)'}
      </button>

      <a
        class="text-blue-4 hover:text-blue-5 underline flexcs"
        href={repo.remote}
        target="_blank"
      >
        <InternetIcon class="mr2" />
        {repo.remote.replace('https://', '')}
      </a>

      {#if repo.name}
        <button
          class="flexcs hover:text-red-5"
          onclick={() => removeRepo(repo.name!)}
        >
          <TrashIcon />
        </button>
      {/if}
    </div>
  {/each}
  <div class="p2">
    {#if showAddRepo}
      <AddRepoInput
        onConfirm={addRepo}
        onCancel={() => (showAddRepo = false)}
      />
    {:else}
      <button
        class="rounded-md bg-green-500 text-white w-full h10 flexcc b b-black/10 hover:bg-green-400"
        onclick={() => (showAddRepo = true)}
      >
        Add Repository
      </button>
    {/if}
  </div>
</div>
