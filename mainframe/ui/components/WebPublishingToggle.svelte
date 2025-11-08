<script lang="ts">
  import GlobeIcon from '~icons/fa6-solid/globe'
  import { tooltip } from '@/center/svooltip'

  const p: {
    toggled: boolean
    onToggle: () => void
  } = $props()
</script>

<button
  aria-label="Toggle web publishing"
  use:tooltip={{
    content: 'Web publishing',
    placement: 'top',
  }}
  onclick={() => p.onToggle()}
  class={[
    'p1 text-white text-2.5 h5 w5 hover:brightness-110 rounded-1 relative',
    {
      'bg-gray-700 shadow-[inset_0_.7px_0_0.6px_#0003,0_0_0_1px_#0004] translate-y-1px brightness-85':
        p.toggled,
      'bg-gray-500 shadow-[0_1.5px_0_.5px_#0004]': !p.toggled,
    },
  ]}
>
  <GlobeIcon class="filter-drop-shadow-[0_0.5px_0.5px_#0007]" />
</button>
