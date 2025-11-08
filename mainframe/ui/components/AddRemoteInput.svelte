<script lang="ts">
  import ArrowLeftIcon from '~icons/fa6-solid/arrow-left'
  import NiftyBtn from './NiftyBtn.svelte'
  import NiftyInput from './NiftyInput.svelte'
  import { openInBrowser } from '../electron-bridge'

  const p: {
    onConfirm: (name: string) => void
    onCancel: () => void
    name: string
  } = $props()

  let remote = $state('')

  function handleSubmit() {
    if (remote) {
      p.onConfirm(remote)
    }
  }
</script>

<div class="text-xs">
  <div class="flexcc space-x-1.5 text-xs">
    <button class="opacity-30 hover:opacity-100" onclick={() => p.onCancel()}>
      <ArrowLeftIcon class="" />
    </button>
    <div class="flex-grow">
      <NiftyInput
        class="w-full"
        placeholder="Remote Git repo"
        bind:value={remote}
        onConfirm={handleSubmit}
        onCancel={p.onCancel}
      />
    </div>
    <NiftyBtn onclick={() => handleSubmit()}>Confirm</NiftyBtn>
  </div>
  <div class="flexce h6">
    <button
      class="underline hover:text-sky-500"
      onclick={() => openInBrowser(`https://github.com/new?name=${p.name}`)}
      >Open Github new repo form</button
    >
  </div>
</div>
