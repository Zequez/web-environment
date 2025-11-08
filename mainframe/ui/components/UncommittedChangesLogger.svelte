<script lang="ts">
  import ChangeIcon from '~icons/fa6-solid/file-invoice'
  import { tooltip } from '@/center/svooltip'
  import NiftyInput from './NiftyInput.svelte'
  import NiftyBtn from './NiftyBtn.svelte'

  const P: { changes: string; onConfirm: (msg: string) => void } = $props()

  let commitMsg = $state('')
</script>

<div class="flex space-x-1.5">
  <div
    class="text-3 flexcc"
    use:tooltip={{
      content: `<pre>${P.changes}</pre>`,
      html: true,
      placement: 'top',
    }}
  >
    <ChangeIcon />
  </div>

  <NiftyInput
    placeholder="Message"
    bind:value={commitMsg}
    onConfirm={() => P.onConfirm(commitMsg)}
  />
  <NiftyBtn onclick={() => P.onConfirm(commitMsg)}>Commit</NiftyBtn>
</div>
