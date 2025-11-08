<script lang="ts">
  import AddRemoteInput from './AddRemoteInput.svelte'
  import NiftyBtn from './NiftyBtn.svelte'

  let P: { onConfirm: (url: string) => void; repoName: string } = $props()

  let settingUp = $state(false)
</script>

{#if settingUp}
  <AddRemoteInput
    name={P.repoName}
    onConfirm={(url) => {
      P.onConfirm(url)
      settingUp = false
    }}
    onCancel={() => (settingUp = false)}
  />
{:else}
  <NiftyBtn color="sky" onclick={() => (settingUp = true)} expand={true}
    >Setup Remote</NiftyBtn
  >
{/if}
