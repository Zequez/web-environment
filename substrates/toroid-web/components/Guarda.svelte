<script lang="ts">
  import type { ClassValue } from 'svelte/elements'

  const props: { title: string; image?: string; class?: ClassValue } = $props()
</script>

<div id="nav-start"></div>
<div
  class={[
    'print:hidden',
    'sticky flex-shrink-0 bottom-0 text-center tracking-wide flexcc overflow-hidden w-full',
    'h6',
    props.class || [
      'bg-gray-200 text-gray-600 text-shadow-[0_1px_0_#fff]',
      'dark:(bg-gray-800! text-gray-300! text-shadow-[0_1px_0_#000])',
    ],
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
    class="font-serif relative"
  >
    {#if props.image}
      <div
        class="absolute top-10% right-100% mr1 h-80% opacity-20 dark:filter-invert"
      >
        <img
          src={props.image}
          class="h-full max-w-none"
          alt="Intricate design on left of name"
        />
      </div>
    {/if}

    {props.title}

    {#if props.image}
      <div
        class="absolute top-10% left-100% ml1 h-80% scale-x-[-1] opacity-20 dark:filter-invert"
      >
        <img
          src={props.image}
          class="h-full max-w-none"
          alt="Intricate design on right of name"
        />
      </div>
    {/if}
  </a>
</div>
