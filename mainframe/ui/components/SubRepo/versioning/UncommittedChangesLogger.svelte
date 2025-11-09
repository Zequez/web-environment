<script lang="ts">
  import ChangeIcon from '~icons/fa6-solid/file-invoice'
  import { tooltip } from '@/center/svooltip'
  import NiftyInput from '../../common/NiftyInput.svelte'
  import NiftyBtn from '../../common/NiftyBtn.svelte'

  const {
    changeView = true,
    ...P
  }: {
    changes: string
    onConfirm: (msg: string) => void
    changeView?: boolean
  } = $props()

  let commitMsg = $state('')
  let changesIsFocused = $state(false)
</script>

<div class="flex space-x-1.5">
  {#if changeView}
    <button
      tabindex={0}
      aria-label="Uncommitted Changes"
      class="text-3 flexcc cursor-default"
      onfocus={() => (changesIsFocused = true)}
      onblur={() => (changesIsFocused = false)}
      use:tooltip={{
        constant: changesIsFocused,
        content: `<pre>${P.changes}</pre>`,
        html: true,
        placement: 'top',
      }}
    >
      <ChangeIcon />
    </button>
  {/if}

  <NiftyInput
    placeholder="Message"
    bind:value={commitMsg}
    onConfirm={() => P.onConfirm(commitMsg)}
  />
  <NiftyBtn onclick={() => P.onConfirm(commitMsg)}>Commit</NiftyBtn>
</div>
