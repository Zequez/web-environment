<script lang="ts">
  import { onMount } from 'svelte'
  import store from './canvas-store.svelte'

  const {
    id,
    data,
    debug,
    children,
  }: {
    id: string
    data: { x: number; y: number; title: string; layer: string }
    debug?: boolean
    children?: any
  } = $props()

  const CS = store.getContext()

  // onMount(() => {
  //   return () => {
  //     CS.cmd.unregisterPin(id)
  //   }
  // })

  let el: HTMLElement
  // let prevPos: typeof pos | null = null
  // $effect(() => {
  //   if (!prevPos) {
  //     console.log('PIN CREATED')
  //   } else if (prevPos !== pos) {
  //     console.log('PIN UPDATED', pos)
  //   } else {
  //     return
  //   }
  //   prevPos = pos
  //   CS.cmd.registerPin(id, { x: pos.x, y: pos.y, el })
  // })
</script>

{#if debug}
  <div
    class="absolute w10 h10 -translate-1/2 bg-white rounded-full flexcc flex-col font-mono z-999 text-[8px] b-3 b-black/20 pointer-events-none whitespace-nowrap"
    style="left: {data.x}px; top: {data.y}px;"
  >
    <div class="bg-black text-white rounded-sm px.5 mb.5">{id}</div>
    <div class="bg-black text-white rounded-sm px.5">{data.x},{data.y}</div>
  </div>
{/if}

<div
  class="absolute pointer-events-none"
  style="left: {data.x}px; top: {data.y}px;"
  data-id={id}
  data-title={data.title}
  data-layer={data.layer}
  bind:this={el}
>
  <div
    class="absolute top-0 left-0 pointer-events-none w-full h-full -translate-x-1/2"
    {id}
  ></div>
  {#if children}
    {@render children()}
  {/if}
</div>
