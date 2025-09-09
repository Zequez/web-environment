<script lang="ts">
  import { onMount } from 'svelte'
  import { type DirectoryTree } from 'directory-tree'

  import { SERVER_FILES_PORT } from '@/center/ports'
  import { cx } from '@/center/utils'
  import { type BackMsg, type FrontMsg } from '@/back/servers/files-server'

  let socket = $state<WebSocket>(null!)
  let dirTree = $state<DirectoryTree>(null!)
  const repo = __REPO__

  let selected = $state<string | null>(null)
  let filesBuffers = $state<{ [key: string]: string }>({})
  let filesEditBuffer = $state<{ [key: string]: string }>({})
  let resolvedSelected = $derived(
    selected && (filesEditBuffer[selected] || filesBuffers[selected]),
  )

  function sortTree(tree: DirectoryTree): DirectoryTree {
    // Directories first
    // Files second
    // Alphabetical order
    const newTree = { ...tree }
    newTree.children = tree.children!.sort((a, b) => {
      if (a.children && !b.children) {
        return -1
      }
      if (!a.children && b.children) {
        return 1
      }
      return a.name
        .toLocaleLowerCase()
        .localeCompare(b.name.toLocaleLowerCase())
    })

    return newTree
  }

  function sendMsg(msg: FrontMsg) {
    socket.send(JSON.stringify(msg))
  }

  onMount(() => {
    console.log('EDITOR MOUNT')

    socket = new WebSocket(`ws://localhost:${SERVER_FILES_PORT}?repo=${repo}`)

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as BackMsg
        console.log('🔻', data)
        switch (data[0]) {
          case 'files-tree': {
            const [, tree] = data
            dirTree = sortTree(tree)
            if (!selected) {
              const indexFile = dirTree.children!.find(({ name }) =>
                name.match(/index/),
              )
              const newSelected = indexFile || dirTree.children?.[0] || null
              if (newSelected) {
                pickFile(newSelected.path)
              }
            }
            break
          }
          case 'file-content': {
            const [, name, content] = data
            filesBuffers[name] = content
            if (filesEditBuffer[name]) {
              if (filesBuffers[name] !== filesEditBuffer[name]) {
                alert('Conflict!')
              } else {
                delete filesEditBuffer[name]
              }
            }
            break
          }
        }
      } catch (e) {
        console.log('Invalid data', e)
        return
      }
      console.log(`Socket message!`, event.data)
    })
  })

  function pickFile(path: string) {
    selected = path
    sendMsg(['read-file', path])
  }

  function updateFile(path: string, content: string) {
    console.log('Updating file!', path, content)
    filesEditBuffer[path] = content
    // socket.send(JSON.stringify(['write-file', path, content]))
  }

  function saveFiles() {
    for (const [path, content] of Object.entries(filesEditBuffer)) {
      sendMsg(['write-file', path, content])
    }
  }

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  function handleKeydown(event: KeyboardEvent) {
    if (isMac ? event.metaKey : event.ctrlKey) {
      if (event.key === 's') {
        saveFiles()
        // updateFile(selected!, htmlToDataString(resolvedSelected))
      }
    }

    if (event.key === 'Escape' && expandedViewer) {
      toggleExpandedViewer()
    }
  }

  let expandedViewer = $state<boolean>(false)
  function toggleExpandedViewer() {
    expandedViewer = !expandedViewer
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#snippet filesTree(children: DirectoryTree[], depth: number = 0)}
  {#each children as { path, name, children: subChildren }}
    <button
      class={cx(
        'relative px2 py.5 hover:bg-black/10 block w-full text-left whitespace-nowrap overflow-hidden text-ellipsis',
        { 'bg-blue-300/30': selected === path },
      )}
      onclick={subChildren ? () => {} : () => pickFile(path)}
    >
      <div
        class={cx({
          'b-l b-black/30': depth > 0,
        })}
        style={`padding-left: ${depth * 0.5}rem;`}
      >
        {name}
      </div>
      {#if filesEditBuffer[path]}
        <div
          class="h1.5 w1.5 rounded-full absolute right-2 top-1/2 -translate-y-50% bg-black"
        ></div>
      {/if}
    </button>
    {#if subChildren}
      {@render filesTree(subChildren, depth + 1)}
    {/if}
  {/each}
{/snippet}

<div class="flex size-full">
  <div
    class="w-20% flex-shrink-0 bg-gray-200 b-r b-r-gray-300 overflow-auto text-xs text-black/75"
  >
    <div class="bg-black/15 text-black font-bold uppercase px2 py1">{repo}</div>
    <div class="">
      {#if dirTree}
        {@render filesTree(dirTree.children!)}
      {:else}
        Loading...
      {/if}
    </div>
  </div>
  <div class="w-40% flex-shrink-0">
    {#if selected && typeof filesBuffers[selected] === 'string'}
      <textarea
        class="w-full h-full block font-mono"
        onkeyup={(e) => updateFile(selected!, e.currentTarget.value)}
        value={resolvedSelected}
      ></textarea>
    {/if}
  </div>
  <!-- <div>Blocks content</div> -->
  <div class="w-40% flex-shrink-0 flex flex-col">
    <div class="bg-gray-800 text-white px2 flex">
      <div class="flex-grow">Preview</div>
      <button onclick={toggleExpandedViewer} class="hover:text-blue-300">
        Expand
      </button>
    </div>
    <iframe
      title="Preview"
      class={cx('w-full flex-grow bg-white', {
        'fixed top-0 left-0 right-0 bottom-0 h-full': expandedViewer,
      })}
      src="/"
    ></iframe>
  </div>
</div>
