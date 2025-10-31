<script lang="ts">
  import { draggable } from '@/center/utils/runes.svelte'

  import { store as canvasStore } from '@/center/canvas'
  import type { Repo } from '@/mainframe/servers/git-server/messages'
  import PowerIcon from '~icons/fa6-solid/power-off'

  let CS = canvasStore.getContext()

  const props: {
    repo: Repo
    viteServer: string | undefined
    onToggleVite: () => void
    onPosUpdated: (pos: { x: number; y: number }) => void
  } = $props()

  const drag = draggable(
    () => {
      console.log('DRAG STARTING')
    },
    () => {
      console.log('DRAGGING')
    },
    () => {
      console.log('DRAG DONE')
      props.onPosUpdated({
        x: drag.dragging!.x / CS.zoom,
        y: drag.dragging!.y / CS.zoom,
      })
    },
  )
</script>

<div
  class="pointer-events-auto -translate-x-1/2 whitespace-nowrap bg-white rounded-2 relative"
  style={drag.dragging
    ? `top: ${drag.dragging.y / CS.zoom}px; left: ${drag.dragging.x / CS.zoom}px;`
    : ''}
>
  <div
    class="absolute inset-0 pointer-events-none rounded-2 z-9999 shadow-[inset_0_0_0_1.5px_#000a]"
  ></div>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    onmousedown={drag.handleDragOnMouseDown}
    class={[
      ' px3 rounded-t-2 h12 cursor-move flexcs ',
      {
        'bg-green-500/20 ': props.viteServer,
        'bg-gray-200 ': !props.viteServer,
      },
    ]}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <button
      onmousedown={(ev) => ev.stopPropagation()}
      class={[
        'w5 h5 rounded-full bg-gray-100 mr2 b b-black/10  flexcc text-white',
        {
          'bg-gray-400 hover:bg-green-400': !props.viteServer,
          'bg-green-400 hover:bg-red-400': props.viteServer,
        },
      ]}
      onclick={props.onToggleVite}
    >
      <PowerIcon class="w-70%" />
    </button>
    {props.repo.name}
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="w-230px h-36 rounded-b-2"
    onmousedown={(ev) => ev.stopPropagation()}
  >
    <div class="text-center shadow-[inset_0_0_3px_0_#0005] bg-gray-100">
      {#if props.viteServer}
        {props.viteServer}
      {:else}
        ...
      {/if}
    </div>
  </div>
</div>
