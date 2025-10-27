<script lang="ts">
  import { onMount, tick, type Component, setContext } from 'svelte'

  const props: {
    pages: Record<string, { Component: Component }>
    currentPage: string
    pageNameToNavPath: Record<string, string>
    nav: string[][]
    Container: Component
  } = $props()

  for (let nav of props.nav) {
    for (let page of nav) {
      if (!props.pages[page]) {
        throw new Error(`Page "${page}" not found`)
      }
    }
  }

  document.body.classList.add('overflow-y-scroll')

  let flatNavPagesList = $derived(props.nav.flat())

  let otherPages = $derived.by(() => {
    return Object.keys(props.pages).filter(
      (page) => flatNavPagesList.indexOf(page) === -1,
    )
  })

  setContext('preview-page-mode', true)

  let container: HTMLDivElement

  let columns = $derived(props.nav.length)
  let viewportWidth = $state(document.documentElement.clientWidth)

  // Why does it need the page size?
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Because when we shrink the element with scale, the actual element does not
  // change in size, so then it does not work in a grid as one would expect.
  // So we read the size, and then manually assign a scaled width and height
  // to the container so that it works on the grid

  let pagesSizes = $state<{ [key: string]: { w: number; h: number } }>({})

  let scale = $derived(1 / columns) // This is the base scale

  let gap = 12
  let clientWidthMinusGaps = $derived(viewportWidth - (columns + 1) * gap)
  let scaleAdjustedForGap = $derived(
    scale * (clientWidthMinusGaps / viewportWidth),
  )

  let isMeasureRender = $derived(Object.keys(pagesSizes).length === 0)

  let testMode = true

  onMount(() => {
    calculatePageSizes()
  })

  function calculatePageSizes() {
    // calculateScale()
    container.querySelectorAll('[data-name]').forEach((c) => {
      const pageName = c.getAttribute('data-name')!
      pagesSizes[pageName] = {
        // These values are not affected by scaling transformation
        w: c.clientWidth,
        h: c.clientHeight,
      }
    })

    console.log(pagesSizes)
  }

  let isResizing = $state(false)
  let resizingDebounce: any = null
  function receiveResizingEvent(ev: UIEvent) {
    console.log(document.documentElement.clientWidth, viewportWidth)

    // Only changes in width matter
    if (document.documentElement.clientWidth === viewportWidth) {
      return
    }

    if (!isResizing) {
      isResizing = true
    }

    clearTimeout(resizingDebounce)
    resizingDebounce = setTimeout(() => {
      endResizing()
      isResizing = false
    }, 150)
  }

  function endResizing() {
    recalculatePageSizes()
  }

  function recalculatePageSizes() {
    viewportWidth = document.documentElement.clientWidth
    pagesSizes = {}
    tick().then(calculatePageSizes)
  }
</script>

<svelte:window onresize={receiveResizingEvent} />

<div
  class={[
    'relative w-full overflow-hidden',
    {
      'overflow-hidden': isMeasureRender && !testMode,
      flex: !isMeasureRender,
    },
  ]}
  bind:this={container}
>
  {#each props.nav as navColumn, i (i)}
    <div class="flex flex-col" style={`padding-top: ${gap}px;`}>
      {#each navColumn as pageName (pageName)}
        {@const Page = props.pages[pageName]}
        {@const size = pagesSizes[pageName]}

        <div
          class={[
            {
              'fixed top-0 left-0': isMeasureRender,
              'relative overflow-hidden rounded-1 b b-white/80 bg-white/10':
                !isMeasureRender,
            },
          ]}
          style={size
            ? `margin-right: ${gap}px;
              margin-bottom: ${gap}px;
              ${i === 0 ? `margin-left: ${gap}px;` : ''}
              width: ${size.w * scaleAdjustedForGap}px;
              height: ${size.h * scaleAdjustedForGap}px;`
            : null}
        >
          <div
            data-name={pageName}
            style={`width: ${viewportWidth}px; ${size ? `transform: scale(${scaleAdjustedForGap})` : ''}`}
            class={[
              'pointer-events-none transform-origin-tl overflow-hidden',
              {
                hidden: isResizing,
              },
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
