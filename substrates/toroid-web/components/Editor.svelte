<script lang="ts" module>
  if (import.meta.hot) {
    // let scrollY = 0
    // let scrollX = 0

    // // before the module is replaced, capture scroll
    // import.meta.hot.dispose(() => {
    //   scrollX = window.scrollX
    //   scrollY = window.scrollY
    //   sessionStorage.setItem(
    //     '__hmr_scroll',
    //     JSON.stringify({ x: scrollX, y: scrollY }),
    //   )
    // })

    // after the new module is accepted, restore scroll
    import.meta.hot.accept((a) => {
      console.log('Editor accept!', a)
      // const raw = sessionStorage.getItem('__hmr_scroll')
      // if (raw) {
      //   const { x, y } = JSON.parse(raw)
      //   requestAnimationFrame(() => {
      //     window.scrollTo(x, y)
      //   })
      // }
    })
  }
</script>

<script lang="ts">
  import { streamTunnel, tunnel } from '@/center/tunnel'
  import { lsState } from '@/center/utils/runes.svelte'
  import { onMount, type Component } from 'svelte'
  import CodeEditor from './CodeEditor.svelte'

  let props: { pageName: string } = $props()

  let fileName = $derived(`repos/${__REPO__}/pages/${props.pageName}.svelte`)
  let fileContent = $state<null | string>(null)
  let lastModifiedAt = lsState(`editor-last-modified-at-${props.pageName}`, {
    v: 0,
  })
  let editorState = lsState<{
    cursorPos: number
    scrollPos: number
    value: string
    timestamp: number
  }>(`editor-state-${props.pageName}`, {
    cursorPos: 0,
    scrollPos: 0,
    value: '',
    timestamp: 0,
  })

  onMount(() => {
    // tunnel('substrates/toroid-web/tunnel.ts/readFile', { file: fileName }).then(
    //   (file) => {
    //     console.log(file)
    //   },
    // )
    return streamTunnel<
      [{ file: string }],
      { file: string | null; content: string; lastModified: number }
    >('substrates/toroid-web/tunnel.ts/streamReadFile', {
      file: fileName,
    })(
      ({
        file,
        content,
        lastModified,
      }: {
        file: string | null
        content: string
        lastModified: number
      }) => {
        if (file) {
          fileContent = content
          if (lastModifiedAt.v < lastModified) {
            console.log('Edited from somewhere else')
            lastModifiedAt.v = lastModified
            if (
              editorState.value !== fileContent &&
              lastModified > editorState.timestamp
            ) {
              editorState.value = fileContent
              editorState.timestamp = lastModified
            }
          }
        } else {
          console.log('Deleted?')
        }
      },
    )
  })

  onMount(() => {
    return () => {
      console.log('Is unmounting')
    }
  })

  let pressSave = $state(false)
  function handleCmdS(ev: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const isMetaKey = isMac ? ev.metaKey : ev.ctrlKey
    if (isMetaKey && ev.key === 's') {
      doSave()
      ev.preventDefault()
      pressSave = true
      setTimeout(() => {
        pressSave = false
      }, 250)
    }
  }

  async function doSave() {
    if (fileContent) {
      const lastModified = await tunnel(
        'substrates/toroid-web/tunnel.ts/writeFile',
        {
          file: fileName,
          content: editorState.value!,
        },
      )

      lastModifiedAt.v = lastModified
      editorState.timestamp = lastModified
    }
  }

  function handleEditorUpdate(newState: typeof editorState) {
    editorState.cursorPos = newState.cursorPos
    editorState.scrollPos = newState.scrollPos
    editorState.value = newState.value
    editorState.timestamp = newState.timestamp
  }
</script>

<svelte:window onkeydown={handleCmdS} />

<!-- <div class="flex fixed inset-0 z-999 bg-white">
  <div class="w-1/2 flex flex-col b-r-2 b-gray-600">-->
<div class="flex flex-col h-full">
  <div class="flex relative">
    <div class="w-full relative">
      {#if editorState.value !== fileContent}
        <div class="bg-red-500 rounded-full h3 w3 absolute right-1 top-1"></div>
      {/if}
      <input value={props.pageName} class="w-full px2 py1.5 bg-gray-50" />
    </div>
    <button
      onclick={doSave}
      class={[
        'bg-blue-400 text-white font-mono px2 py1.5 hover:brightness-110 text-shadow-[0_1px_0_#0005] group active:(shadow-[inset_0_2px_2px_1px_#0003] brightness-95)',
        {
          'shadow-[inset_0_2px_2px_1px_#0003] brightness-95': pressSave,
        },
      ]}
      ><span
        class={[
          'group-active:translate-y-1px block',
          {
            'translate-y-1px': pressSave,
          },
        ]}>Save</span
      ></button
    >
  </div>
  {#if fileContent}
    <CodeEditor state={editorState} onUpdate={handleEditorUpdate} />
  {:else}
    Loading...
  {/if}
</div>
<!-- <div class="w-1/2">
    <props.Component />
  </div>
</div> -->
