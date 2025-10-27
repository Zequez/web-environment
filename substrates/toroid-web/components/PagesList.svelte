<script lang="ts">
  import { onMount, tick, type Component, setContext } from 'svelte'
  import SlotSentinel from './SlotSentinel.svelte'

  const props: {
    pages: Record<string, { Component: Component }>
    currentPage: string
    pageNameToNavPath: Record<string, string>
    nav: string[][]
    Container: Component
  } = $props()

  // Check if all pages exist
  for (let nav of props.nav) {
    for (let page of nav) {
      if (!props.pages[page]) {
        throw new Error(`Page "${page}" not found`)
      }
    }
  }

  setContext('preview-page-mode', true)
  let container: HTMLDivElement
  let columns = $derived(props.nav.length)

  // Make sure the scroll is always visible otherwise the page size calcualtions will be off
  document.body.classList.add('overflow-y-scroll')
  let viewportWidth = $state(document.documentElement.clientWidth)

  // Get pages that are not shown on the navigation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let flatNavPagesList = $derived(props.nav.flat())

  let otherPages = $derived.by(() => {
    return Object.keys(props.pages).filter(
      (page) => flatNavPagesList.indexOf(page) === -1,
    )
  })

  // Page sizing and scaling
  // ━━━━━━━━━━━━━━━━━━━━━━━

  // Why does it need the page size?
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

  let pageSizeTestMode = false

  onMount(() => {
    calculatePageSizes()
  })

  function calculatePageSizes() {
    container.querySelectorAll('[data-name]').forEach((c) => {
      const pageName = c.getAttribute('data-name')!
      pagesSizes[pageName] = {
        // These values are not affected by scaling transformation
        w: c.clientWidth,
        h: c.clientHeight,
      }
    })
  }

  // Resizing handling
  // ━━━━━━━━━━━━━━━━━

  let isResizing = $state(false)
  let resizingDebounce: any = null
  function receiveResizingEvent(ev: UIEvent) {
    // Only changes in width matter
    if (document.documentElement.clientWidth === viewportWidth) {
      return
    }

    if (!isResizing) {
      isResizing = true
    }

    clearTimeout(resizingDebounce)
    resizingDebounce = setTimeout(endResizing, 150)
  }

  function endResizing() {
    isResizing = false
    viewportWidth = document.documentElement.clientWidth
    pagesSizes = {}
    tick().then(calculatePageSizes)
  }

  // Progressive Pages Rendering by Neccesity
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  let navToRender = $state<string[][]>(props.nav.map(() => []))

  // onMount(() => {
  //   checkNavNecessity()
  // })

  let slotsRenderNecessity = $state(props.nav.map(() => false))

  function receiveSlotSentinelEnterView(column: number) {
    slotsRenderNecessity[column] = true
    necessityChange()
  }

  function receiveSlotSentinelLeaveView(column: number) {
    slotsRenderNecessity[column] = false
    necessityChange()
  }

  let neccesityCheckDebounce: any = null
  function necessityChange() {
    clearTimeout(neccesityCheckDebounce)
    neccesityCheckDebounce = setTimeout(checkNavNecessity, 100)
  }

  function checkNavNecessity() {
    let pageAdded = false
    for (let i = 0; i < slotsRenderNecessity.length; i++) {
      if (slotsRenderNecessity[i]) {
        // console.log(`Column ${i} needs page`)
        let currentlyRendered = navToRender[i].length
        // console.log(`There are ${currentlyRendered} pages rendered`)
        if (props.nav[i].length > currentlyRendered) {
          // console.log(`Adding page ${props.nav[i][currentlyRendered]}`)
          navToRender[i].push(props.nav[i][currentlyRendered])
          pageAdded = true
        }
      }
    }

    if (pageAdded) {
      tick().then(calculatePageSizes)
      setTimeout(() => {
        checkNavNecessity()
      })
    }
  }

  // $inspect(slotsRenderNecessity)
</script>

<svelte:window onresize={receiveResizingEvent} />

<div
  class={['relative w-full overflow-hidden flex']}
  style={`padding: 0 ${gap / 2}px;`}
  bind:this={container}
>
  {#each navToRender as navColumn, i (i)}
    <div
      class="flex flex-col"
      style={`padding-top: ${gap}px; padding-left: ${gap / 2}px; padding-right: ${gap / 2}px`}
    >
      {#each navColumn as pageName (pageName)}
        {@const Page = props.pages[pageName]}
        {@const size = pagesSizes[pageName]}
        {@const measureRender = !size}

        <div
          class={[
            'transition-opacity transition-duration-1000',
            {
              'fixed top-0 left-0 opacity-0': measureRender,
              'relative overflow-hidden rounded-1 b b-white/80 bg-white/10 opacity-100':
                !measureRender,
            },
          ]}
          style={size
            ? `margin-bottom: ${gap}px;
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
      {#if navToRender[i].length < props.nav[i].length}
        <div
          style={`
          margin-bottom: ${gap}px;
          width: ${viewportWidth * scaleAdjustedForGap}px;`}
        >
          <SlotSentinel
            onEnterView={receiveSlotSentinelEnterView.bind(null, i)}
            onLeaveView={receiveSlotSentinelLeaveView.bind(null, i)}
          />
        </div>
      {/if}
    </div>
  {/each}
</div>
