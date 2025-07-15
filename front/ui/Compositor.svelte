<script lang="ts">
  import { onMount } from 'svelte'
  import { cx } from '@/center/utils'
  import FolderIcon from '~icons/fa6-solid/folder-open'
  import InternetIcon from '~icons/fa6-solid/globe'
  import TrashIcon from '~icons/fa6-solid/trash'
  import AddRepoInput from './AddRepoInput.svelte'
  import { UPLINK_PORT } from '../../back/ports'
  import type { BackMsg, FrontMsg, Repo } from '@back/uplink/messages'

  let repos: Repo[] = $state<Repo[]>([])
  let repos2: Repo2[] = $state<Repo2[]>([])
  let showAddRepo = $state(false)
  let socket = $state<WebSocket>(null!)

  type Repo2 = {
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
    }
  }

  function addRepo(name: string) {
    console.log('Adding repo!', name)
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
    {@const syncStatus: string = 'unknown'}
    <div
      class={cx('flex space-x-4 mb2 px2', {
        'b-b-1 py2 bg-gray-200': !repo.name,
      })}
    >
      <div class="rounded-md w6 h6 flexcc">
        {#if syncStatus === 'local-updated'}
          <span title="Local updated">🟡⬆️</span>
        {:else if syncStatus === 'remote-updated'}
          <span title="Local updated">🟡⬇️</span>
        {:else if syncStatus === 'conflict'}
          <span title="Local updated">⚠️</span>
        {:else if syncStatus === 'synced'}
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

      {#if repo.status[0] === 'dir'}
        <button
          onclick={() => cmd('init-repo-git', repo.name!)}
          class="bg-green-500 text-white px1 rounded-md"
        >
          Initialize repo
        </button>
      {:else if repo.status[0] === 'git'}
        <div>
          <input placeholder="Remote URL" class="rounded-md px1" type="text" />
          <button class="bg-green-500 text-white px1 rounded-md">
            Add remote
          </button>
        </div>
      {:else if repo.status[0] === 'git-full'}
        <a
          class="text-blue-4 hover:text-blue-5 underline flexcs"
          href={repo.status[1]}
          target="_blank"
        >
          <InternetIcon class="mr2" />
          {repo.status[1].replace('https://', '')}
        </a>
      {/if}

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
    <AddRepoInput
      takenNames={repos.filter((r) => r.name).map((r) => r.name!)}
      onConfirm={(name) => cmd('add-repo', name)}
      onCancel={() => (showAddRepo = false)}
    />
  </div>
</div>
