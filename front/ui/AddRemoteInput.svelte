<script lang="ts">
  import InternetIcon from '~icons/fa6-solid/globe'

  const p: {
    onConfirm: (name: string) => void
  } = $props()

  let remote = $state('')

  function handleSubmit(ev: Event) {
    ev.preventDefault()
    ev.stopPropagation()
    if (remote) {
      p.onConfirm(remote)
    }
  }
</script>

<form class="flexcc space-x-2 h10" onsubmit={handleSubmit}>
  <InternetIcon />
  <input
    bind:value={remote}
    class={'rounded-md h8 px2 b b-black/10 outline-green-500 flex-grow'}
    placeholder="Remote Git repo"
  />
  <button
    type="submit"
    disabled={!remote}
    class={'bg-green-500 text-white h8 flexcc px2 rounded-md b b-black/10  hover:bg-green-400 disabled:(saturate-0 hover:bg-green-500 opacity-50)'}
  >
    Add
  </button>
</form>
