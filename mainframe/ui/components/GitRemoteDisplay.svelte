<script lang="ts">
  const { url }: { url: string } = $props()
  const noHttp = $derived(url.replace('https://', '').replace('http://', ''))

  const knownHost = $derived.by(() => {
    if (noHttp.startsWith('github.com')) {
      const parts = noHttp.split('/')
      return ['Github', parts[1], parts[2].replace(/\.git$/, '')]
    } else {
      return null
    }
  })
</script>

<span
  class="text-black/80 flex space-x-.5 transition-all transition-duration-200 group-hover:(space-x-1)"
>
  {#if knownHost}
    <span
      class=" bg-gray-7 text-white b b-black/10 rounded-sm px.5 group-hover:(bg-gray-8 transition-duration-0 transition-delay-0) transition-delay-150"
    >
      {knownHost[0]}
    </span>
    <span
      class=" bg-gray-2 b b-black/10 rounded-sm px.5 transition-all group-hover:(bg-gray-8 text-white transition-duration-50 transition-delay-50) transition-duration-0 transition-delay-100"
    >
      {knownHost[1]}
    </span>
    <span
      class=" bg-gray-2 b b-black/10 rounded-sm px.5 transition-all group-hover:(bg-gray-8 text-white transition-duration-50 transition-delay-100) transition-duration-0 transition-delay-50"
    >
      {knownHost[2]}
    </span>
  {:else}
    <span>{noHttp}</span>
  {/if}
</span>
