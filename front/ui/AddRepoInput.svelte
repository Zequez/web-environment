<script lang="ts">
  import FolderIcon from '~icons/fa6-solid/folder-open'
  import InternetIcon from '~icons/fa6-solid/globe'

  const p: {
    onCancel: () => void
    onConfirm: (name: string, remote: string) => void
  } = $props()

  let name = $state('')
  let remote = $state('')

  function handleSubmit(ev: Event) {
    ev.preventDefault()
    ev.stopPropagation()
    if (name && remote) {
      p.onConfirm(name, remote)
    }
  }
</script>

<form class="flexcc space-x-2 h10" onsubmit={handleSubmit}>
  <FolderIcon />
  <input
    bind:value={name}
    class="rounded-md h8 px2 b b-black/10 outline-green-500"
    placeholder="Name"
  />
  <InternetIcon />
  <input
    bind:value={remote}
    class="rounded-md h8 px2 b b-black/10 outline-green-500 flex-grow"
    placeholder="Remote URL"
  />
  <button
    type="submit"
    disabled={!name || !remote}
    class="bg-green-500 text-white h8 flexcc px2 rounded-md b b-black/10 hover:bg-green-400 disabled:(saturate-0 hover:bg-green-500 opacity-50)"
  >
    Confirm
  </button>
  <button
    type="button"
    onclick={() => p.onCancel()}
    class="bg-red-500 text-white h8 flexcc px2 rounded-md b b-black/10 hover:bg-red-400"
  >
    Cancel
  </button>
</form>
