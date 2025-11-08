<script lang="ts">
  import { copyToClipboard } from '@/center/utils'
  import OpenExternalIcon from '~icons/fa6-solid/square-arrow-up-right'
  import OpenWindowIcon from '~icons/fa6-solid/window-maximize'
  import { openInBrowser } from '../electron-bridge'
  import { tooltip } from '@/center/svooltip'

  const P: { localUrl: string } = $props()
</script>

<div class="flexcc h6 space-x-1.5">
  <button
    class="font-mono lh-6 text-3 group relative flex-grow bg-gray-50 rounded-1 shadow-[inset_0_0_0_0.5px_#0003]"
    onclick={() => copyToClipboard(P.localUrl)}
  >
    {P.localUrl}
    <div
      class="group-hover:flexcc hidden absolute inset-0 bg-gray-700 rounded-1 text-white"
      >COPY</div
    >
  </button>
  <button
    class="hover:text-sky-500"
    onclick={() => openInBrowser(P.localUrl)}
    use:tooltip={{
      content: 'Open in default web browser',
      placement: 'top',
    }}><OpenExternalIcon /></button
  >
  <a
    href={P.localUrl}
    target="_blank"
    class="hover:text-sky-500 cursor-pointer"
    use:tooltip={{
      content: 'Open in separate window',
      placement: 'top',
    }}><OpenWindowIcon /></a
  >
</div>
