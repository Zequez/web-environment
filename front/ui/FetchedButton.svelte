<script lang="ts">
  import { cx, timeAgoMini } from '@/center/utils'
  import { onMount } from 'svelte'
  import RotateIcon from '~icons/fa6-solid/rotate'
  import DownloadIcon from '~icons/fa6-solid/download'
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
      class={cx(
        'bg-blue-400 hover:bg-blue-500 disabled:(saturate-0 pointer-events-none) text-white flexcc rounded-md text-xs h6 w6 b b-black/10 mr2',
      )}
    >
      <RotateIcon
        class={cx('', {
          'animate-spin': isFetching,
        })}
      />
    </button>
    <div class="text-xs flex-grow text-left text-black/70">
      {isFetching
        ? 'Fetching'
        : lastFetchedAt
          ? `${lastFetchedAtAgo} ago`
          : 'Fetch'}
    </div>
  {/if}
</div>
