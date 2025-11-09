<script lang="ts">
  import UploadIcon from '~icons/fa6-solid/upload'
  import DownloadIcon from '~icons/fa6-solid/download'
  import CheckIcon from '~icons/fa6-solid/check'
  import CodeMergeIcon from '~icons/fa6-solid/code-merge'
  import RotateIcon from '~icons/fa6-solid/rotate'
  import type { SyncStatus } from '@/mainframe/servers/git-server/messages'
  import { cx } from '@/center/utils'
  import NiftyBtn from '../../common/NiftyBtn.svelte'

  const {
    status,
    onAction,
    disabled,
  }: { status: SyncStatus | null; onAction: () => void; disabled: boolean } =
    $props()

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
      ? 'lime'
      : status === 'ahead'
        ? 'sky'
        : status === 'behind'
          ? 'red'
          : status === 'diverged'
            ? 'yellow'
            : status === 'unknown'
              ? 'gray'
              : null,
  )
</script>

{#if Icon}
  <NiftyBtn
    aria-label={`${text} -> ${action}`}
    title={text!}
    onclick={onAction}
    color={color as 'red'}
    disabled={!actionable || disabled}
  >
    <Icon
      aria-hidden={true}
      class={cx('w-4 relative z-30 text-xs flexcc mr2', {
        'animate-spin': status === 'unknown',
      })}
    />
    <span
      aria-hidden={true}
      class="relative z-30 inline-block flex-grow text-center text-3"
    >
      {action}
    </span>
  </NiftyBtn>
{:else}
  <div class="w24 flex-shrink-0 text-center text-sm text-gray-500">
    Local-only
  </div>
{/if}
