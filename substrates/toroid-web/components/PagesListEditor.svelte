<script lang="ts">
  import CheckIcon from '~icons/fa6-solid/check'
  import CancelIcon from '~icons/fa6-solid/xmark'
  import PenIcon from '~icons/fa6-solid/pen'
  import Kanban from '@/center/components/Kanban/Kanban.svelte'
  import PageNameEdit from './PageNameEdit.svelte'
  import { tunnel } from '@/center/tunnel'
  import { onMount } from 'svelte'
  import type { PagesUpdate } from './App.svelte'

  const props: {
    nav: string[][]
    allPages: string[]
  } = $props()
  let nav = $state(props.nav)

  export function getUpdate(): PagesUpdate {
    return {
      nav,
      renamed: renamed,
      deleted: deleted,
      created: created,
    }
  }

  let deleted = $state<string[]>([])
  let renamed = $state<{ [key: string]: string }>({})
  let created = $state<string[]>([])
  let editingPageName = $state<null | string>(null)

  onMount(() => {
    // tunnel('substrates/toroid-web/tunnel.ts/setAppNav', {
    //   nav: [
    //     ['potato', 'salad'],
    //     ['foo', 'bar'],
    //   ],
    //   repo: __REPO__,
    // }).then((ast) => {
    //   console.log(ast)
    //   // const AppEl = ast.html.children.find(
    //   //   (c: any) => c.type === 'InlineComponent' && c.name === 'App',
    //   // )
    //   // const NavAttr = AppEl.attributes.find((atr: any) => atr.name === 'nav')
    //   // console.log(NavAttr)
    // })
  })

  function saveNav() {
    // tunnel('substrates/toroid-web/tunnel.ts/setAppNav', {
    //   nav,
    //   repo: __REPO__,
    // }).then((success) => {
    //   console.log('Saving nav success?', success)
    // })
  }

  // let mounted = false
  // $effect(() => {
  //   JSON.stringify(nav)
  //   if (!mounted) {
  //     mounted = true
  //   } else {
  //     saveNav()
  //   }
  // })

  function renamePage(newName: string) {
    if (newName && editingPageName) {
      if (newName === editingPageName) {
        editingPageName = null
        return
      }
      // nav = nav.map((col) => col.filter((id) => id !== editingPageName))
      // nav = nav.map((col) => [...col, newName])
      for (let col of nav) {
        let index = col.indexOf(editingPageName)
        if (index !== -1) {
          col[index] = newName
        }
      }
      const createdIndex = created.indexOf(editingPageName)
      console.log(createdIndex, created, editingPageName)
      if (createdIndex === -1) {
        let renamedKeys = Object.keys(renamed)
        let renamedValues = Object.values(renamed)
        let renamedIndex = renamedValues.indexOf(editingPageName)
        if (renamedIndex !== -1) {
          const originalValue = renamedKeys[renamedIndex]
          if (originalValue === newName) {
            delete renamed[originalValue]
          } else {
            renamed[originalValue] = newName
          }
        } else {
          renamed[editingPageName] = newName
        }
      } else {
        created[createdIndex] = newName
      }
    }
    editingPageName = null
  }

  function createPage(name: string) {
    created.push(name)
  }

  function removePage(id: string) {
    if (renamed[id]) {
      delete renamed[id]
    }
    if (created.indexOf(id) === -1) {
      deleted.push(id)
    } else {
      created.splice(created.indexOf(id), 1)
    }
  }

  $effect(() => {
    console.log(JSON.stringify({ nav, renamed, created, deleted }, null, 2))
  })
</script>

<div class="fixed inset-6 z-15 bg-main-800 z-999 shadow-md rounded-2">
  <div>
    <Kanban bind:cols={nav} onChange={saveNav} containerCols={5}>
      {#snippet renderItem(
        id: string,
        handleDragStart: (ev: MouseEvent) => void,
        handleRemove: () => void,
      )}
        <!-- {@const value = items[id]} -->
        <div class="font-mono text-white @[400px]:(text-4)">
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          {#if editingPageName === id}
            <PageNameEdit
              initialValue={id}
              unavailableValues={nav
                .flat()
                .filter((id) => id !== editingPageName)}
              onConfirm={(newName) => renamePage(newName)}
              onCancel={() => (editingPageName = null)}
            />
          {:else}
            <div
              class={'relative w-full text-left group/item bg-main-600 cursor-move lh-6 px1 py.5 rounded-0.5 @[400px]:(px3 rounded-1) '}
              onmousedown={(ev) => {
                if (ev.button === 1) {
                  removePage(id)
                  handleRemove()
                } else {
                  handleDragStart(ev)
                }
              }}
            >
              {id}
              <button
                onclick={() => (editingPageName = id)}
                onmousedown={(ev) => ev.stopPropagation()}
                class="group-hover/item:flexcc hidden hover:text-main-200 cursor-pointer absolute right-0 h6 w6 top-0 text-2.5"
                ><PenIcon /></button
              >
            </div>
          {/if}
        </div>
      {/snippet}

      {#snippet renderAddItem(
        confirm: (id: string) => void,
        cancel: () => void,
      )}
        <PageNameEdit
          initialValue=""
          unavailableValues={nav.flat()}
          onConfirm={(name) => {
            createPage(name)
            confirm(name)
          }}
          onCancel={cancel}
        />
      {/snippet}
    </Kanban>
  </div>
</div>
