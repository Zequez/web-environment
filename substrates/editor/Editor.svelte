<script lang="ts">
  import { onMount } from 'svelte'
  import { type DirectoryTree } from 'directory-tree'

  import { SERVER_FILES_PORT } from '@/center/ports'
  import { cx } from '@/center/utils'
  import { type BackMsg, type FrontMsg } from '@/back/servers/files-server'

  import { htmlToDataString } from './compiler'

  let socket = $state<WebSocket>(null!)
  let dirTree = $state<DirectoryTree>(null!)
  const repo = document.location.pathname.slice(1)

  let selected = $state<string | null>(null)
  let entrypoint = $state<string | null>(null)
  let filesBuffers = $state<{ [key: string]: string }>({})
  let filesEditBuffer = $state<{ [key: string]: string }>({})
  let resolvedSelected = $derived(
    selected && (filesEditBuffer[selected] || filesBuffers[selected]),
  )
  let resolvedEntrypoint = $derived(
    entrypoint && (filesEditBuffer[entrypoint] || filesBuffers[entrypoint]),
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

  onMount(() => {
    console.log('EDITOR MOUNT')

    socket = new WebSocket(`ws://localhost:${SERVER_FILES_PORT}?repo=${repo}`)

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as BackMsg
        console.log('🔻', data)
        switch (data[0]) {
          case 'files-tree': {
            dirTree = sortTree(data[1])
            break
          }
          case 'file-content': {
            filesBuffers[data[1]] = data[2]
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
    if (path.endsWith('.html')) {
      entrypoint = path
    }
    socket.send(JSON.stringify(['read-file', path]))
  }

  function updateFile(path: string, content: string) {
    console.log('Updating file!', path, content)
    filesEditBuffer[path] = content
    // socket.send(JSON.stringify(['write-file', path, content]))
  }
</script>

{#snippet filesTree(children: DirectoryTree[], depth: number = 0)}
  {#each children as { path, name, children: subChildren }}
    <button
      class={cx(
        'relative px2 py.5 hover:bg-black/10 block w-full text-left whitespace-nowrap overflow-hidden text-ellipsis',
        { 'bg-blue-300/30': selected === path },
        { underline: entrypoint === path },
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
  <div class="w-40% flex-shrink-0">
    {#if entrypoint && typeof filesBuffers[entrypoint] === 'string'}
      <iframe
        title={entrypoint}
        class="w-40% flex-shrink-0"
        src={htmlToDataString(resolvedEntrypoint!)}
      ></iframe>
    {/if}
  </div>
</div>
