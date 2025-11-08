<script lang="ts">
  import { openInBrowser } from '../electron-bridge'
  import GithubIcon from '~icons/fa6-brands/github'

  const P: { url: string } = $props()

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
  class="flexcs font-mono text-3 bg-gray-100 group rounded-.5 px1 shadow-[0_1px_0_0_#0006]"
>
  {#if host === 'github'}
    <GithubIcon class="mr1 text-3 flex-shrink-0" />
  {:else}
    {host}
  {/if}

  <span
    class="underline underline-(dashed black/50) group-hover:(underline-solid underline-black/100)"
    >{path}</span
  >
</button>
