<script lang="ts">
  import type { ClassValue } from 'svelte/elements'
  import { openInBrowser } from '../../electron-bridge'
  import GithubIcon from '~icons/fa6-brands/github'

  const P: { url: string; class?: ClassValue } = $props()

  function extractRepo(url: string): [host: 'github' | string, path: string] {
    const noHttp = url.replace('https://', '').replace('http://', '')
    const parts = noHttp.split('/')
    const host = parts[0] === 'github.com' ? 'github' : parts[0]
    return [host, parts.slice(1).join('/').replace(/.git$/, '')]
  }

  let [host, path] = $derived(extractRepo(P.url))
</script>

<button
  onclick={() => openInBrowser(P.url)}
  aria-label="Open {P.url} in browser"
  class={[
    P.class,
    'flexcs font-mono cursor-pointer text-3 lh-6 overflow-hidden w-full bg-gray-100 hover:bg-white group rounded-.5 px1 text-black shadow-[0_1px_0_0_#0006]',
  ]}
>
  {#if host === 'github'}
    <GithubIcon class="mr1 text-3 flex-shrink-0" />
  {:else}
    {host}
  {/if}

  <span
    class="text-left underline underline-(dashed black/50) group-hover:(underline-solid underline-black/100) overflow-hidden text-ellipsis flex-grow"
    >{path}</span
  >
</button>
