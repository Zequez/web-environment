<script lang="ts" module>
  export type Config = {
    type: 'Fliers'
    fliers: Record<string, Flier>
  }

  type Flier = {
    img: string
    title: string
    description: string
    hue: number
  }
</script>

<script lang="ts">
  import Portal from 'svelte-portal'

  const { config }: { config: Config } = $props()

  function replaceMarkdownLinks(input: string): string {
    return input.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_match, text, link) => `<a href="${link}">${text}</a>`,
    )
  }

  let showFlier = $state<string | null>(null)
  function handleFlierClick(flierId: string) {
    showFlier = flierId
    document.body.classList.add('no-scrollbar')
  }

  function handleEscKey(ev: KeyboardEvent) {
    if (ev.key === 'Escape') {
      closeFlier()
    }
  }

  function closeFlier() {
    showFlier = null
    document.body.classList.remove('no-scrollbar')
  }

  let container = $state<HTMLElement | null>(null)
  let flierEl = $state<HTMLElement | null>(null)

  $effect(() => {
    if (container && flierEl) {
      if (container.scrollWidth > container.clientWidth) {
        // flierEl.style =
      }
    }
  })
</script>

<svelte:window onkeydown={showFlier ? handleEscKey : null} />

<div class="flexcc flex-wrap">
  {#each Object.entries(config.fliers) as [id, { img, title, hue }] (id)}
    <button
      class="w30 h48 bg-blue-400 b-2 b-blue-400 shadow-md rounded-md mx2 my2 overflow-hidden hover:(shadow-[0_0_0_3px_#fff] b-blue-300) transition-transform transition-100"
      onclick={handleFlierClick.bind(null, id)}
    >
      <img
        src={img}
        alt={title}
        style={`filter: hue-rotate(${hue}deg) saturate(150%)`}
        class="w-full h-full object-cover"
      />
    </button>
  {/each}
</div>

<div class="flexcc mt6">
  <button
    class="bg-alt-400 font-semibold tracking-wider text-white uppercase rounded-md text-sm px3 py2 hover:bg-alt-500"
  >
    Agregar cartel
  </button>
</div>

{#if showFlier}
  {@const flier = config.fliers[showFlier]}
  <Portal target="body">
    <div bind:this={container} class="fixed inset-0 z-10000">
      <div
        class="absolute inset-0 z-10 overflow-auto py4 flexcs flex-col pointer-events-none"
      >
        <img
          src={flier.img}
          alt={flier.title}
          style={`filter: hue-rotate(${flier.hue}deg) saturate(150%)`}
          class="w-30 h48 object-cover rounded-md mb4 z-10 pointer-events-auto"
        />
        <div class="px2 sm:px4 max-w-screen-md z-10" bind:this={flierEl}>
          <pre
            class="flier-pre bg-main-800 p2 sm:p4 rounded-lg z-10 text-6px xs:text-[8px] sm:text-xs md:text-base tracking-tight pointer-events-auto">
            {@html replaceMarkdownLinks(flier.description)}
          </pre>
        </div>
      </div>
      <button
        aria-label="Close flier"
        class="bg-main-200 absolute inset-0 z-9"
        onclick={closeFlier}
      ></button>
    </div>
  </Portal>
{/if}

<style>
  :global {
    body.no-scrollbar {
      scrollbar-width: 0;
    }
    body.no-scrollbar::-webkit-scrollbar {
      display: none;
    }

    .flier-pre a {
      @apply text-alt-500 underline font-bold;
    }
  }
</style>
