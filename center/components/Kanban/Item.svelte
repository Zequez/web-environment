<script lang="ts" module>
  import type { Snippet } from 'svelte'

  export type KanbanItemSnippet = (
    id: string,
    handleDragStart: (ev: MouseEvent) => void,
    handleRemove: () => void,
  ) => ReturnType<Snippet>
</script>

<script lang="ts">
  import { draggable } from '@/center/utils/runes.svelte'

  let {
    id,
    trackDragHover,
    onDragHover,
    onRemove,
    onDragStart,
    onDragComplete,
    renderItem,
  }: {
    id: string
    onRemove: () => void
    trackDragHover: boolean
    onDragHover: (ev: MouseEvent) => void
    onDragStart: (el: HTMLElement) => void
    onDragComplete: () => void
    renderItem: KanbanItemSnippet
  } = $props()

  const DRAG = draggable(
    () => {
      onDragStart(el)
    },
    () => {
      // onDragProgress(DRAG.dragging!.x, DRAG.dragging!.y)
    },
    () => {
      onDragComplete()
    },
  )

  let el: HTMLElement
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class={[
    'py-0.75 group relative',
    {
      'z-999': DRAG.dragging,
      'z-15': !DRAG.dragging,
    },
  ]}
  onmousemove={trackDragHover ? onDragHover : undefined}
>
  <div
    bind:this={el}
    class={[
      'bg-gray-500 shadow-[inset_0_0_0_1.5px] shadow-gray-800 rounded-1 relative',
    ]}
    style={DRAG.dragging
      ? `transform: translate(${DRAG.dragging.x}px, ${DRAG.dragging.y}px); pointer-events: none;`
      : ''}
  >
    {@render renderItem(id, DRAG.handleDragOnMouseDown, onRemove)}
  </div>
</div>
