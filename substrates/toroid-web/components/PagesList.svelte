<script lang="ts">
  import { onMount, tick, type Component, setContext } from 'svelte'
  import type { ClassValue } from 'svelte/elements'

  const props: {
    pages: Record<string, { Component: Component }>
    currentPage: string
    pageNameToNavPath: Record<string, string>
    nav: string[][]
    Container: Component
  } = $props()

  const NAV = props.nav

  for (let nav of NAV) {
    for (let page of nav) {
      if (!props.pages[page]) {
        throw new Error(`Page "${page}" not found`)
      }
    }
  }

  setContext('preview-page-mode', true)

  let container: HTMLDivElement

  let pagesSizes = $state<{ [key: string]: { w: number; h: number } }>({})
  const LINE = 24
  let spacing = (LINE / 2) * (NAV.length + 1)

  let scale = $state(
    1 / NAV.length - LINE / 2 / document.documentElement.clientWidth,
  )

  function calculateScale() {
    scale = 1 / NAV.length - LINE / 2 / document.documentElement.clientWidth
  }

  onMount(() => {
    calculatePageSizes()

    // function isNetworkIdle() {
    //   const entries = performance.getEntriesByType('resource')
    //   const now = performance.now()

    //   // Check for any recent network activity (in last ~300ms)
    //   const active = entries.some((e) => now - e.startTime < 300)
    //   return !active
    // }

    // async function waitForIdle(interval = 100, timeout = 10000) {
    //   const start = performance.now()
    //   while (performance.now() - start < timeout) {
    //     if (isNetworkIdle()) return
    //     await new Promise((r) => setTimeout(r, interval))
    //   }
    // }
  })

  function calculatePageSizes() {
    calculateScale()
    container.querySelectorAll('[data-name]').forEach((c) => {
      const pageName = c.getAttribute('data-name')!
      pagesSizes[pageName] = {
        w: c.clientWidth,
        h: c.clientHeight,
      }
    })
  }

  function recalculatePageSizes() {
    pagesSizes = {}
    tick().then(calculatePageSizes)
  }

  let isFirstRender = $derived(Object.keys(pagesSizes).length === 0)
</script>

<svelte:window onresize={recalculatePageSizes} />

<div
  class={[
    'relative w-full',
    {
      'overflow-hidden h-0': isFirstRender,
      'grid grid-cols-4 pl3': !isFirstRender,
    },
  ]}
  bind:this={container}
>
  {#each NAV as navColumn, i (i)}
    <div
      class={[
        {
          contents: isFirstRender,
          'flex flex-col space-y-3 pt3': !isFirstRender,
        },
      ]}
    >
      {#each navColumn as pageName (pageName)}
        {@const Page = props.pages[pageName]}
        {@const size = pagesSizes[pageName]}

        <div
          class={[
            {
              'absolute top-0 left-0': isFirstRender,
              'relative overflow-hidden rounded-1 b b-white/80': !isFirstRender,
            },
          ]}
          style={size
            ? `width: ${size.w * scale}px; height: ${size.h * scale}px;`
            : null}
        >
          <div
            data-name={pageName}
            style={`transform: scale(${scale})`}
            class={[
              'pointer-events-none transform-origin-tl w-screen overflow-hidden',
            ]}
          >
            <props.Container>
              <Page.Component />
            </props.Container>
          </div>
          <a
            href={props.pageNameToNavPath[pageName]}
            class={[
              'absolute inset-0 hover:bg-white/10 text-black/0',
              {
                'shadow-[inset_0_0_0px_3px] shadow-yellow-500':
                  props.currentPage === pageName,
              },
            ]}>{pageName}</a
          >
        </div>
      {/each}
    </div>
  {/each}
</div>
