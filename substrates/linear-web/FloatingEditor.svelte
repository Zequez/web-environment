<script lang="ts">
  import Editor from './Editor.svelte'
  import { draggable, lsState } from '@/center/utils/runes.svelte'
  import CaretIcon from '~icons/fa6-solid/caret-right'

  let pos = lsState<{ x: number; y: number }>('editor-position', {
    x: 10,
    y: 0,
  })

  let isUnfolded = lsState('editor-unfolded', { val: true }, true)

  const DRAG = draggable(
    () => {},
    ({ dx, dy }) => {
      pos.x += dx
      pos.y += dy
    },
    () => {
      if (!DRAG.dragging!.didMove) {
        isUnfolded.val = !isUnfolded.val
      }
    },
    3,
  )

  let isMoving = $derived(DRAG.dragging !== null && DRAG.dragging.didMove)
</script>

<div
  class="fixed top-0 left-0 z-999 w-500px shadow-md"
  style={`transform: translate(${pos.x}px, ${pos.y}px);`}
>
  <div class="rounded-md bg-gray-100 overflow-hidden">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class={[
        'px1 uppercase text-sm flexcs text-black/60 h-6 font-semibold tracking-wide ',
        {
          'bg-gray-200 hover:bg-gray-300': !isMoving,
          'bg-gray-300 cursor-move': isMoving,
        },
      ]}
      onmousedown={(ev) => DRAG.handleDragOnMouseDown(ev)}
    >
      <CaretIcon
        class={[
          'w4',
          {
            'rotate-90': isUnfolded.val,
          },
        ]}
      />
      <div class="ml1 cursor-default">Editor</div>
    </div>
    {#if isUnfolded.val}
      <div class="">
        <Editor />
      </div>
    {/if}
  </div>
</div>
