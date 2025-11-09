<script lang="ts">
  import FolderIcon from '~icons/fa6-solid/folder-open'
  import type { Repo } from '@/mainframe/servers/git-server/messages'
  import { openOnFileExplorer } from '../electron-bridge'
  import GitRemoteDisplay from './common/GitRemoteDisplay.svelte'
  import ThreeDots from '@/center/components/ThreeDots.svelte'
  import FetchNSync from './SubRepo/versioning/FetchNSync.svelte'
  import UncommittedChangesLogger from './SubRepo/versioning/UncommittedChangesLogger.svelte'
  import { lsState } from '@/center/utils/runes.svelte'

  const {
    repo,
    onFetch,
    onSync,
    onCommit,
  }: {
    repo: Repo
    onFetch: () => void
    onSync: () => void
    onCommit: (msg: string) => void
  } = $props()

  const status = $derived(repo.status)
  const localChangesToggled = lsState('mainframe-local-changes-toggle', {
    v: false,
  })
</script>

<div class="flex flex-col space-y-3">
  {#if status[0] === 'git-full'}
    <div class="flexcs space-x-3">
      <button
        onclick={() => openOnFileExplorer(null)}
        aria-label="Open filesystem"
        class="w6 h6 flexcc text-white hover:text-lime-400 p1"
      >
        <FolderIcon />
      </button>
      <GitRemoteDisplay class="flex-grow" url={status[1]} />
    </div>
    <FetchNSync {repo} {onFetch} {onSync} />
  {/if}
  {#if repo.uncommittedChanges}
    <div class="bg-black/20 rounded-1">
      <div class="text-white lh-6 text-3 font-mono px3"
        >Local changes detected</div
      >
      <pre
        class="w-full max-h-200px overflow-auto text-2 bg-gray-700 text-white"
        >{repo.uncommittedChanges}</pre
      >
      <div class="p3">
        <UncommittedChangesLogger
          changeView={false}
          onConfirm={(msg) => {
            onCommit(msg)
          }}
          changes={repo.uncommittedChanges}
        />
      </div>
    </div>
  {/if}
</div>
