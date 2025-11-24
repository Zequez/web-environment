<script lang="ts">
  import Kanban from './Kanban.svelte'

  type KanbanValue = string[][]

  let items = $state<{ [key: string]: string }>({
    i1: 'Item 1',
    i2: 'Item 2',
    i3: 'Item 3',
    i4: 'Item 4',
    i5: 'Item 5',
    i6: 'Item 6',
    i7: 'Item 7',
  })

  let kanbanState = $state<KanbanValue>([['i1', 'i2'], ['i3'], ['i5']])

  function handleAddItem() {
    const newId = `i${Object.keys(items).length + 1}`
    items[newId] = `New item ${Math.random()}`
    return newId
  }

  // function handleUpdateItemValue(id: string, value: string) {
  //   items[id] = value
  // }

  const itemsNotInKanban = $derived(
    Object.keys(items).filter((id) => {
      return !kanbanState.flat().includes(id)
    }),
  )
</script>

{#snippet renderKanbanItem(
  id: string,
  handleDragStart: (ev: MouseEvent) => void,
  handleRemove: () => void,
)}
  <!-- {@const value = items[id]} -->
  <div class="font-mono text-white text-2.5 @[400px]:(text-4)">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class={'bg-pink-700 cursor-move px1 py.5 rounded-t-0.5 @[400px]:(px3 py1.5 rounded-t-1) '}
      onmousedown={(ev) => {
        if (ev.button === 1) {
          handleRemove()
        } else {
          handleDragStart(ev)
        }
      }}>{id}</div
    >
    <pre
      contenteditable="true"
      bind:innerHTML={items[id]}
      class="outline-none px1 py.5 rounded-b-0.5 @[400px]:(px3 py1.5 rounded-b-1) bg-pink-500 whitespace-pre-wrap"
    ></pre>
  </div>
{/snippet}

{#snippet renderKanbanAddItem(
  confirm: (id: string) => void,
  cancel: () => void,
)}
  <div class="flexcs flex-wrap pt1.5">
    {#each itemsNotInKanban as id}
      <button
        class="flexcc bg-yellow-600 px3 py1.5 mr3 mb3 text-white rounded-1"
        onclick={() => confirm(id)}>{id}</button
      >
    {/each}

    <button
      class="flexcc bg-green-600 px3 py1.5 mb3 text-white rounded-1"
      onclick={() => confirm(handleAddItem())}>Add</button
    >
  </div>

  <button
    class="flexcc bg-gray-600 px3 py1.5 text-white rounded-1"
    onclick={() => cancel()}>Cancel</button
  >
{/snippet}

<div class="flex space-x-1.5">
  <button class="h20 w20 bg-red-400">Hey</button>
  <div class="h20 w20 bg-blue-400"></div>
</div>
<div class="text-white clear-both">
  <div>600x500</div>
  <div class="w-600px h500px bg-green-500/10 float-left">
    <Kanban
      bind:cols={kanbanState}
      containerCols={6}
      renderItem={renderKanbanItem}
      onAddItem={handleAddItem}
      renderAddItem={renderKanbanAddItem}
    />
  </div>
  <div class="float-left">
    300x300
    <div class="w300px h300px bg-green-500/10">
      <Kanban
        bind:cols={kanbanState}
        containerCols={4}
        renderItem={renderKanbanItem}
        onAddItem={handleAddItem}
        renderAddItem={renderKanbanAddItem}
      />
    </div>
  </div>
</div>
