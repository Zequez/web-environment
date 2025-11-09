<script lang="ts">
  import CodeBranchIcon from '~icons/fa6-solid/code-branch'
  import CloudIcon from '~icons/fa6-solid/cloud'
  import { tooltip } from '@/center/svooltip'

  const p: {
    gitStatus: 'git' | 'git-full' | 'unknown'
    toggled: boolean
    onToggle: () => void
  } = $props()
</script>

<button
  aria-label="Toggle Versioning"
  use:tooltip={{
    content: 'Change Tracking & Co-op system',
    placement: 'top',
  }}
  onclick={() => p.onToggle()}
  class={[
    'p1 h5 hover:brightness-110 rounded-1 relative text-white text-2.5 flexcc',
    {
      'bg-gray-700 shadow-[inset_0_.7px_0_0.6px_#0003,0_0_0_1px_#0004] translate-y-1px brightness-85':
        p.toggled,
      'bg-gray-500 shadow-[0_1.5px_0_.5px_#0004]': !p.toggled,
      w5: p.gitStatus !== 'git-full',
      w10: p.gitStatus === 'git-full',
    },
  ]}
>
  <CodeBranchIcon
    class="relative z-9 filter-drop-shadow-[0_0.5px_0.5px_#0007]"
  />
  {#if p.gitStatus === 'git-full'}
    <!-- <div class="absolute top-.25 right-.5 text-2 z-8"> -->
    <CloudIcon class="text-2.3 -translate-y-2px translate-x-4px" />
    <!-- </div> -->
  {/if}
</button>
