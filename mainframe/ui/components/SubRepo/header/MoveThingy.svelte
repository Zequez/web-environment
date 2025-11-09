<script lang="ts">
  import PlayIcon from '~icons/fa6-solid/play'

  const p: {
    onUp: () => void
    onDown: () => void
    onLeft: () => void
    onRight: () => void
  } = $props()
</script>

{#snippet arrow(rot: string, round: string, ev: () => void, label: string)}
  <button
    aria-label={label}
    onclick={() => ev()}
    class={[
      round,
      'h3.5 w3.5 hover:(bg-black text-gray-200) flexcc relative transform-origin-center  text-3 shadow-[0_0_0_1px_#0007]',
    ]}
  >
    <div class={['absolute inset-0 flexcc transform-origin-center', rot]}
      ><PlayIcon /></div
    ></button
  >
{/snippet}

<div
  class="h-7 w-7 rounded-1 flex flex-wrap bg-white rotate-45 shadow-[1.5px_1.5px_0_0_#0009] -translate-y-1px text-black/70"
>
  {@render arrow('-rotate-135', 'rounded-tl-1 rounded-br-3', p.onUp, 'Move up')}
  {@render arrow(
    '-rotate-45',
    'rounded-tr-1 rounded-bl-3',
    p.onRight,
    'Move right',
  )}
  {@render arrow(
    'rotate-135',
    'rounded-bl-1 rounded-tr-3',
    p.onLeft,
    'Move left',
  )}
  {@render arrow(
    'rotate-45',
    'rounded-br-1 rounded-tl-3',
    p.onDown,
    'Move down',
  )}
</div>
