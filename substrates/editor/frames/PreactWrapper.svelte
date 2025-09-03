<script lang="ts">
  import { onMount } from 'svelte'
  import { render } from 'preact'
  import type { MDXContent } from 'mdx/types'

  const { component }: { component: MDXContent } = $props()
  let el = $state<HTMLDivElement | null>(null)
  let err = $state<unknown | null>(null)

  onMount(() => {
    try {
      render(component({}), el!)
      err = null
    } catch (e) {
      err = e
    }
  })
</script>

<div bind:this={el}></div>
{#if err}
  <pre>{err}</pre>
{/if}
