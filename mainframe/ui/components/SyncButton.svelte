<script lang="ts">
  import UploadIcon from '~icons/fa6-solid/upload'
  import DownloadIcon from '~icons/fa6-solid/download'
  import CheckIcon from '~icons/fa6-solid/check'
  import CodeMergeIcon from '~icons/fa6-solid/code-merge'
  import RotateIcon from '~icons/fa6-solid/rotate'
  import type { SyncStatus } from '@/mainframe/servers/git-server/messages'
  import { cx } from '@/center/utils'

  const {
    status,
    onAction,
  }: { status: SyncStatus | null; onAction: () => void } = $props()

  let Icon = $derived(
    status === 'in-sync'
      ? CheckIcon
      : status === 'ahead'
        ? UploadIcon
        : status === 'behind'
          ? DownloadIcon
          : status === 'diverged'
            ? CodeMergeIcon
            : status === 'unknown'
              ? RotateIcon
              : null,
  )

  let text = $derived(
    status === 'in-sync'
      ? 'In-sync'
      : status === 'ahead'
        ? 'Ahead'
        : status === 'behind'
          ? 'Behind'
          : status === 'diverged'
            ? 'Diverged'
            : status === 'unknown'
              ? 'Fetching'
              : null,
  )

  let actionable = $derived(
    status === 'ahead' || status === 'behind' || status === 'diverged',
  )

  let action = $derived(
    status === 'in-sync'
      ? 'In-sync'
      : status === 'ahead'
        ? 'Push'
        : status === 'behind'
          ? 'Pull'
          : status === 'diverged'
            ? 'Merge'
            : status === 'unknown'
              ? 'Fetching'
              : null,
  )

  let color = $derived(
    status === 'in-sync'
      ? 'bg-emerald-500 text-emerald-500'
      : status === 'ahead'
        ? 'bg-blue-500'
        : status === 'behind'
          ? 'bg-red-500'
          : status === 'diverged'
            ? 'bg-yellow-400'
            : status === 'unknown'
              ? 'bg-gray-400'
              : null,
  )
</script>

{#if Icon}
  <button
    aria-label={`${text} -> ${action}`}
    title={text}
    onclick={onAction}
    class={cx(
      `${color} h6 relative block flexcc b b-black/10 px2 overflow-hidden group py1 rounded-1 font-mono uppercase whitespace-nowrap w24 flex-shrink-0`,
      {
        'b b-black/10 text-white shadow-[0_1px_2px_1px_#0003] bg-gradient-to-b active:bg-gradient-to-t active:top-0.15 from-white/10 to-white/0 ':
          actionable,
        'text-black/80': !actionable,
      },
    )}
    disabled={!actionable}
  >
    {#if actionable}
      <div
        class="absolute z-40 inset-0 hidden group-hover:block group-active:bg-white/20 bg-white/10"
      ></div>
    {:else}
      <div class="absolute z-20 inset-0.25 rounded-[4px] bg-white/95"></div>
    {/if}
    <Icon
      aria-hidden={true}
      class={cx('w-4 relative z-30 text-xs flexcc', {
        'animate-spin': status === 'unknown',
      })}
    />
    <span
      aria-hidden={true}
      class="relative z-30 inline-block flex-grow text-center text-3"
    >
      {action}
    </span>
  </button>
{:else}
  <div class="w24 flex-shrink-0 text-center text-sm text-gray-500">
    Local-only
  </div>
{/if}
