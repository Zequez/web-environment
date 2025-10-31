<script lang="ts">
  import { draggable } from '@/center/utils/runes.svelte'

  import { store as canvasStore } from '@/center/canvas'
  import type { Repo } from '@/mainframe/servers/git-server/messages'

  let CS = canvasStore.getContext()

  const props: {
    repo: Repo
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
    onmousedown={drag.handleDragOnMouseDown}
    class="bg-black/10 px3 rounded-t-2 cursor-move">{props.repo.name}</div
  >
  <div class="">
    <pre class="w-230px">
      {JSON.stringify(props.repo, null, 2)}
    </pre>
  </div>
</div>
