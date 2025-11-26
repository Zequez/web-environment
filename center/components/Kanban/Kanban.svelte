<script lang="ts" module>
  import { onMount, type Snippet } from 'svelte'

  export type KanbanAddItemSnippet = (
    confirm: (id: string) => void,
    cancel: () => void,
  ) => ReturnType<Snippet>
</script>

<script lang="ts">
  import PlusIcon from '~icons/fa6-solid/plus'
  import MinusIcon from '~icons/fa6-solid/minus'
  import { type KanbanItemSnippet, default as KanbanItem } from './Item.svelte'

  const {
    cols = $bindable(),
    containerCols = 5,
    ...props
  }: {
    cols: string[][]
    // onColsChange: (cols: string[][]) => void
    onChange?: (cols: string[][]) => void
    containerCols?: number
    renderItem: KanbanItemSnippet
    renderAddItem: KanbanAddItemSnippet
  } = $props()

  let containerEl: HTMLElement
  let colWidth = $state<null | number>(null)

  function notify() {
    props.onChange?.(cols)
  }

  onMount(() => {
    colWidth = containerEl.offsetWidth / containerCols
  })

  function addItem(col: number, id: string) {
    cols[col].push(id)
    addingItemOnColumn = null
    notify()
  }

  function addColumn() {
    cols.push([])
    notify()
  }

  function removeItem(col: number, item: number) {
    cols[col].splice(item, 1)
    notify()
  }

  function removeColumn(col: number) {
    cols.splice(col, 1)
    removingColumn = null
    clearTimeout(removingColumnTimeout!)
    notify()
  }

  function moveItem(
    sourceCol: number,
    sourcePos: number,
    targetCol: number,
    targetPos: number,
  ) {
    if (sourceCol === targetCol && sourcePos === targetPos) return

    if (targetCol === cols.length) {
      addColumn()
    }

    const itemVal = cols[sourceCol][sourcePos]
    cols[sourceCol].splice(sourcePos, 1)
    const minusOne = sourceCol === targetCol && targetPos > sourcePos ? -1 : 0
    cols[targetCol].splice(targetPos + minusOne, 0, itemVal)
    notify()
  }

  // Confirmations

  let removingColumnTimeout = $state<null | ReturnType<typeof setTimeout>>(null)
  let removingColumn = $state<null | number>(null)
  function confirmRemoveColumn(col: number) {
    clearTimeout(removingColumnTimeout!)
    removingColumn = col
    removingColumnTimeout = setTimeout(() => {
      removingColumn = null
    }, 2000)
  }

  let addingItemOnColumn = $state<null | number>(null)
  function beginAddingItem(col: number) {
    addingItemOnColumn = col
  }

  function confirmAddingItem(id: string) {
    addItem(addingItemOnColumn!, id)
  }

  function cancelAddingItem() {
    addingItemOnColumn = null
  }

  // DRAG HANDLING

  let resolvedDropZone = $state<null | [number, number]>(null)
  let isDraggingItem = $state<null | [number, number, HTMLElement]>(null)

  function onDragStart(col: number, pos: number, el: HTMLElement) {
    isDraggingItem = [col, pos, el]
    resolvedDropZone = [col, pos]
  }

  function onDragEnd() {
    const [sourceCol, sourcePos] = isDraggingItem!
    const [targetCol, targetPos] = resolvedDropZone!
    moveItem(sourceCol, sourcePos, targetCol, targetPos)

    isDraggingItem = null
    resolvedDropZone = null
  }

  function handleDraggingHover(col: number, item: number, ev: MouseEvent) {
    const x = ev.clientX
    const y = ev.clientY
    if (col === cols.length) {
      // On new column
      resolvedDropZone = [col, 0]
    } else {
      let targetColItems = cols[col]

      let targetNextItem = false
      if (item !== targetColItems.length) {
        const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect()
        // const isSameItem = col === isDraggingItem![0] && item === isDraggingItem![1]
        targetNextItem = y > rect.top + rect.height / 2
      }

      let targetItem = item + (targetNextItem ? 1 : 0)
      if (col === isDraggingItem![0] && targetItem - 1 === isDraggingItem![1]) {
        targetItem--
      }
      resolvedDropZone = [col, targetItem]
    }
  }

  $effect(() => {
    document.body.classList.toggle('force-grab', !!isDraggingItem)
  })
</script>

{#snippet itemDropZone(i: number, j: number)}
  {#if resolvedDropZone && resolvedDropZone[0] === i && resolvedDropZone[1] === j}
    <div class="h-0 w-full relative z-9999">
      <div class="h-1.5 bg-blue-400 rounded-1"></div>
    </div>
  {/if}
{/snippet}

<div class="overflow-auto h-full w-full @container" bind:this={containerEl}>
  <div class="w-full h-full flex flex-nowrap relative">
    {#each cols as col, i (i)}
      {#if colWidth}
        <div
          style={`width: ${colWidth}px;`}
          class={[
            ' min-h-full relative flex-shrink-0',
            {
              'z-11': !isDraggingItem,
              'z-20': isDraggingItem && isDraggingItem[0] === i,
            },
          ]}
        >
          <div class="p1.5 pr-0 min-h-full">
            <div
              class="bg-gray-300 shadow-[inset_0_0_0_1.5px_#0007] rounded-1 @[400px]:(rounded-2) px1.5 py0.75 w-full min-h-full group relative"
            >
              {#each col as item, j (j)}
                {@render itemDropZone(i, j)}
                <KanbanItem
                  id={item}
                  trackDragHover={!!isDraggingItem}
                  onDragHover={(ev) => handleDraggingHover(i, j, ev)}
                  onDragStart={(el) => onDragStart(i, j, el)}
                  onDragComplete={onDragEnd}
                  onRemove={() => removeItem(i, j)}
                  renderItem={props.renderItem}
                />
              {/each}
              {@render itemDropZone(i, col.length)}
              {#if isDraggingItem}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  class="absolute bg-green-500/0 top-0 bottom-0 left-0 right-0 z-14"
                  onmousemove={isDraggingItem
                    ? (ev) => handleDraggingHover(i, col.length, ev)
                    : undefined}
                ></div>
              {/if}
              <div
                class={[
                  'opacity-0',
                  {
                    'group-hover:opacity-100': !isDraggingItem,
                    'pointer-events-none': isDraggingItem,
                  },
                ]}
              >
                {#if addingItemOnColumn === i}
                  {@render props.renderAddItem(
                    confirmAddingItem,
                    cancelAddingItem,
                  )}
                {:else}
                  <button
                    onclick={() => beginAddingItem(i)}
                    class={[
                      'w-full my0.75 flexcc text-white text-3 py1.5 @[400px]:(text-6 py4) opacity-0  b-2 b-dashed b-white/40 rounded-1 bg-gray-500 opacity-50 hover:(opacity-100 b-solid) cursor-pointer',
                    ]}
                  >
                    <PlusIcon />
                  </button>
                {/if}
                <div class="flexcc">
                  <button
                    onclick={() =>
                      col.length === 0 || removingColumn === i
                        ? removeColumn(i)
                        : confirmRemoveColumn(i)}
                    class={[
                      'flexcc h6 my1 px1.5 text-2.5 @[400px]:(h9 py1.5 my3 px3 text-4)',
                      'text-white font-mono',
                      'b-2 b-dashed b-white/40  rounded-full ',
                      'opacity-50 hover:(opacity-100 b-solid) cursor-pointer',
                      {
                        'bg-red-500': removingColumn === i,
                        'bg-gray-500': removingColumn !== i,
                      },
                    ]}
                  >
                    {#if removingColumn === i}
                      Confirm
                    {:else}
                      <MinusIcon />
                    {/if}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    {/each}
    {#if colWidth}
      <div
        class="p1.5 min-h-full flex-shrink-0"
        style={`width: ${colWidth}px;`}
      >
        <button
          onclick={() => addColumn()}
          onmousemove={isDraggingItem
            ? (ev) => handleDraggingHover(cols.length, 0, ev)
            : undefined}
          class={[
            'flex-shrink-0 relative w-full z-10 flexcc',
            'text-white text-4 @[400px]:(text-8) cursor-pointer',
            ' b-3 b-dashed b-white/40 bg-gray-400  rounded-1',
            'opacity-25 hover:(opacity-100 b-solid)',
            'pt-161%',
          ]}
        >
          <div class="absolute inset-0 flexcc">
            <PlusIcon />
          </div>
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(body.force-grab, body.force-grab *) {
    cursor: grabbing !important;
  }
</style>
