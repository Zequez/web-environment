<script lang="ts">
  import { cx } from '@/center/utils'
  import FolderIcon from '~icons/fa6-solid/folder-open'

  const p: {
    onConfirm: (name: string) => void
    takenNames: string[]
  } = $props()

  let name = $state('')
  let nameIsTaken = $derived(name && p.takenNames.includes(name))
  let nameIsValid = $derived(name && !nameIsTaken)

  function handleSubmit(ev: Event) {
    ev.preventDefault()
    ev.stopPropagation()
    if (nameIsValid) {
      p.onConfirm(name)
      name = ''
    }
  }
</script>

<form class="flexcc space-x-2 h10" onsubmit={handleSubmit}>
  <FolderIcon />
  <input
    bind:value={name}
    class={cx('rounded-md h8 px2 outline-green-500 flex-grow', {
      'b b-black/10 outline-green-500': !nameIsTaken,
      'b b-red-500 outline-red-500': nameIsTaken,
    })}
    placeholder="Name"
  />
  <button
    type="submit"
    disabled={!nameIsValid}
    class={cx(
      'bg-green-500 text-white h8 flexcc px2 rounded-md b b-black/10  hover:bg-green-400 disabled:(saturate-0 hover:bg-green-500 opacity-50)',
    )}
  >
    Add
  </button>
</form>
