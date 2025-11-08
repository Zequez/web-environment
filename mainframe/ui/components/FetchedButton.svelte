<script lang="ts">
  import { timeAgoMini } from '@/center/utils/neutral'
  import { onMount } from 'svelte'
  import RotateIcon from '~icons/fa6-solid/rotate'
  import DownloadIcon from '~icons/fa6-solid/download'
  import ThreeDots from '@/center/components/ThreeDots.svelte'
  const {
    lastFetchedAt,
    isFetching,
    onFetch,
  }: { lastFetchedAt: number; isFetching: boolean; onFetch: () => void } =
    $props()

  let tick = $state(1)
  onMount(() => {
    const interval = setInterval(() => {
      tick += 1
    }, 3000)
    return () => clearInterval(interval)
  })

  let lastFetchedAtAgo = $derived.by(() => {
    tick
    return timeAgoMini(new Date(lastFetchedAt))
  })
</script>

<div class="whitespace-nowrap flexcs w-24 flex-shrink-0">
  {#if lastFetchedAt}
    <button
      disabled={isFetching}
      onclick={onFetch}
      class={'bg-sky-400 hover:brightness-110 flex-shrink-0 disabled:(saturate-0 pointer-events-none) text-white flexcc rounded-1 text-xs h5 w5 b b-black/10 mr2'}
    >
      <RotateIcon
        class={[
          {
            'animate-spin': isFetching,
          },
        ]}
      />
    </button>
    <div class="text-xs flex-grow text-left text-black/70">
      {#if isFetching}
        Fetching<ThreeDots />
      {:else if lastFetchedAt}
        {lastFetchedAtAgo} ago
      {:else}
        Fetch
      {/if}
    </div>
  {/if}
</div>
