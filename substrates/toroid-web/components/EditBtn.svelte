<script lang="ts">
  import type { ClassValue } from 'svelte/elements'
  import PenIcon from '~icons/fa6-solid/pen'
  import CheckIcon from '~icons/fa6-solid/check'
  import { tooltip } from '@/center/svooltip'
  const props: {
    onclick: () => void
    text: string
    class?: ClassValue
    opened: boolean
  } = $props()
</script>

<button
  onclick={props.onclick}
  use:tooltip={{
    content: `Edit ${props.text}`,
    placement: 'left',
    visibility: !props.opened,
  }}
  class={[
    props.class,
    'flexcc h-6 z-1000  px1.5 group',
    'hover:brightness-110 font-semibold text-2.5 uppercase cursor-pointer',
    'b b-black/10 bg-emerald-400 shadow-sm rounded-full text-white active:brightness-95',
  ]}
>
  {#if props.opened}
    <CheckIcon class="mr1.5" />
    Done
  {:else}
    <PenIcon class="mr1.5" />
    {props.text}
  {/if}
</button>
