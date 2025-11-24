<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ClassValue } from 'svelte/elements'

  const props: { title: string; Content?: () => ReturnType<Snippet> } = $props()
</script>

<div id="nav-start"></div>
<div
  class={[
    'print:hidden',
    'sticky flex-shrink-0 bottom-0 flexcc overflow-hidden w-full z-99',
    'min-h6',
  ]}
>
  <span
    class="absolute inset-0 pointer-events-none b-t-1 b-b-1 b-black/20 dark:b-white/50"
  ></span>
  <a
    href="#nav-start"
    onclick={(ev) => {
      const el = document.getElementById('nav-start')!
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      ev.preventDefault()
    }}
    class="relative flexcc w-full h-full"
  >
    <!-- {#if props.image}
      <div
        class="absolute top-10% right-100% mr1 h-80% opacity-20 dark:filter-invert"
      >
        <img
          src={props.image}
          class="h-full max-w-none"
          alt="Intricate design on left of name"
        />
      </div>
    {/if} -->

    {#if props.Content}
      {@render props.Content()}
    {:else}
      <span
        class="font-serif block w-full h-full bg-gray-800 text-white flexcc"
      >
        {props.title}
      </span>
    {/if}

    <!-- {#if props.image}
      <div
        class="absolute top-10% left-100% ml1 h-80% scale-x-[-1] opacity-20 dark:filter-invert"
      >
        <img
          src={props.image}
          class="h-full max-w-none"
          alt="Intricate design on right of name"
        />
      </div>
    {/if} -->
  </a>
</div>
