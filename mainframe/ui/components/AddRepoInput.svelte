<script lang="ts">
  import { cx } from '@/center/utils'
  import NiftyInput from './common/NiftyInput.svelte'
  import NiftyBtn from './common/NiftyBtn.svelte'
  import GitRemoteDisplay from './common/GitRemoteDisplay.svelte'
  import GlobeIcon from '~icons/fa6-solid/globe'
  import { openInBrowser } from '../electron-bridge'
  import reposLibrary from '@/repos-library.yml'

  console.log(reposLibrary)

  const p: {
    onConfirm: (nameOrUrl: string) => void
    takenNames: string[]
  } = $props()

  let name = $state('')
  let nameIsTaken = $derived(name && p.takenNames.includes(name))
  let nameIsValid = $derived(name && !nameIsTaken)

  function handleSubmit(ev?: Event) {
    if (ev) {
      ev.preventDefault()
      ev.stopPropagation()
    }
    if (nameIsValid) {
      p.onConfirm(name)
      name = ''
    }
  }

  let mode = $state<'add' | 'library'>('add')
</script>

{#snippet modeBtn(thisMode: typeof mode, text: string)}
  <div class={['w-1/2 relative pt-1 bg-slate-500']}>
    <div class="absolute top-0 h-1/2 w-full bg-slate-600"></div>
    <button
      onclick={() => (mode = thisMode)}
      class={[
        'relative size-full lh-11 text-center text-white hover:bg-slate-400',
        'text-shadow-[0_1px_0_#0006]',
        'uppercase cursor-pointer font-mono',
        'rounded-t-2',
        {
          'bg-slate-500 ': thisMode === mode,
          'bg-slate-600 ': thisMode !== mode,
          'rounded-bl-2': thisMode !== mode && mode === 'add',
          'rounded-br-2': thisMode !== mode && mode === 'library',
        },
      ]}>{text}</button
    >
  </div>
{/snippet}

{#snippet RepoToAdd(repoUrl: string, webUrl?: string)}
  <div class="flex space-x-1">
    <GitRemoteDisplay url={repoUrl} />
    {#if webUrl}
      <NiftyBtn color="sky" onclick={() => openInBrowser(webUrl)}
        ><GlobeIcon /></NiftyBtn
      >
    {/if}
    <NiftyBtn onclick={() => p.onConfirm(repoUrl)}>Add</NiftyBtn>
  </div>
{/snippet}

<div class="bg-slate-500">
  <div class="flex px1 bg-slate-600">
    {@render modeBtn('add', 'Add')}
    {@render modeBtn('library', 'Library')}
  </div>
  <div class="">
    {#if mode === 'add'}
      <div class="flexcc space-x-3 p3">
        <!-- <FolderIcon /> -->
        <NiftyInput
          bind:value={name}
          onConfirm={() => handleSubmit()}
          class={cx(' flex-grow', {
            'outline-transparent': !nameIsTaken,
            'b b-red-500 outline-red-500': nameIsTaken,
          })}
          placeholder="Name or URL"
        />
        <NiftyBtn disabled={!nameIsValid} onclick={() => handleSubmit()}
          >Add</NiftyBtn
        >
      </div>
    {:else if mode === 'library'}
      <div class="p3 flex flex-col space-y-1">
        {#each Object.entries(reposLibrary) as [name, { url, web, description }]}
          {@render RepoToAdd(url, web)}
        {/each}
      </div>
    {/if}
  </div>
</div>
