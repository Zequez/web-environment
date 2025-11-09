<script lang="ts">
  import { cx } from '@/center/utils'
  import NiftyInput from './common/NiftyInput.svelte'
  import NiftyBtn from './common/NiftyBtn.svelte'

  const p: {
    onConfirm: (name: string) => void
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
</script>

<div class="">
  <div
    class="font-mono uppercase text-white lh-12 -mt3 text-shadow-[0_1px_0_#0008]"
    >Add a project</div
  >
  <div class="flexcc space-x-3">
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
    <NiftyBtn disabled={!nameIsValid}>Add</NiftyBtn>
  </div>
</div>
