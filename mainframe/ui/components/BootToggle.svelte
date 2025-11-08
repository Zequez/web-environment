<script lang="ts">
  import BootIcon from '~icons/fa6-solid/power-off'
  import { tooltip } from '@/center/svooltip.ts'

  const P: { status: 'off' | 'booting' | 'on'; onclick: () => void } = $props()
</script>

<button
  use:tooltip={{
    content: P.status === 'off' ? 'Start' : 'Stop',
    placement: 'top',
  }}
  onclick={() => P.onclick()}
  class={[
    'hover:brightness-110 h5 w5 flexcc rounded-1 relative overflow-hidden',
    {
      'bg-gray-700 shadow-[inset_0_.7px_0_0.6px_#0003,0_0_0_1px_#0004] p1 pt1.5 translate-y-1px':
        P.status === 'booting' || P.status === 'on',
      'text-yellow-400 animate-pulse': P.status === 'booting',
      'text-lime-400': P.status === 'on',
      'text-white bg-gray-500 shadow-[0_1.5px_0_.5px_#0004] p1':
        P.status === 'off',
    },
  ]}
>
  <BootIcon class="relative z-11" />
  {#if P.status !== 'off'}
    <div
      class={[
        'absolute inset-0 z-9',
        {
          'bg-yellow-400/15': P.status === 'booting',
          'bg-lime-400/15': P.status === 'on',
        },
      ]}
    ></div>
    <div
      class={[
        'filter-blur-[1px] text-2.6 absolute mt.5 inset-0 flexcc z-10',
        {
          'animate-pulse': P.status === 'booting',
        },
      ]}
    >
      <BootIcon />
    </div>
  {/if}
</button>

<style>
</style>
