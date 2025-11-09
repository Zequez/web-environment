<script lang="ts">
  import type {
    Repo,
    SyncStatus,
  } from '@/mainframe/servers/git-server/messages'
  import FetchedButton from './FetchedButton.svelte'
  import SyncButton from './SyncButton.svelte'

  const p: { repo: Repo; onSync: () => void; onFetch: () => void } = $props()

  const status = $derived(p.repo.status as ['git-full', string, SyncStatus])
</script>

<div class="flexce relative">
  <FetchedButton
    lastFetchedAt={p.repo.lastFetchedAt}
    isFetching={p.repo.fetching}
    onFetch={() => p.onFetch()}
  />
  <div class="flex-grow"></div>
  <SyncButton
    status={status[2]}
    onAction={() => p.onSync()}
    disabled={p.repo.fetching || p.repo.syncing || !!p.repo.uncommittedChanges}
  />
  {#if p.repo.mergeConflicts}
    <div
      class="bg-red-500 inset-0 absolute rounded-md text-white z-50 text-xs flexcc"
    >
      Merge conflict
    </div>
  {/if}
</div>
