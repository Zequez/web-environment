<script lang="ts">
  import { onMount, type Snippet } from 'svelte'
  import { fade } from 'svelte/transition'
  import store from './canvas-store.svelte'
  import { cx, monitorPinchZoom } from '@/center/utils'
  import EdgeScrollFrame from './EdgeScrollFrame.svelte'
  import BlobDirectionIndicator from './BlobDirectionIndicator.svelte'
  import MiniMap from './MiniMap.svelte'
  import { gatherElements, getCavitationSizeAndOrigin } from './cavitation-calc'

  const { children, background }: { children: Snippet; background: string } =
    $props()

  const CS = store.getContext()

  export const context = CS

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  let scrollContainer = $state<HTMLDivElement>(null!)
  let cavitationContainer = $state<HTMLDivElement>(null!)
  let originContainer = $state<HTMLDivElement>(null!)

  let fgCavitationSize = $state({ w: 0, h: 0 })
  let fgOriginPosition = $state({ x: 0, y: 0 })

  let virtualMap = $state<ActualElement[]>([])

  let viewportFocus = $state<{
    x: number
    y: number
    w: number
    h: number
  } | null>(null)

  type ActualElement = {
    el: HTMLElement

    left: number
    right: number
    top: number
    bottom: number

    x: number
    y: number
    w: number
    h: number

    id: string
    title: string
    layer: string
  }

  function recalculateCavitationSize() {
    const elements = gatherElements(originContainer)

    virtualMap = elements.filter((v) => v.layer === 'fg')
    const virtual = getCavitationSizeAndOrigin(virtualMap)
    fgOriginPosition = virtual.origin
    fgCavitationSize = virtual.size

    const { size, origin } = getCavitationSizeAndOrigin(elements)

    CS.cmd.setCavitationSize(
      scrollContainer,
      cavitationContainer,
      originContainer,
      size,
      origin,
    )
  }

  onMount(() => {
    recalculateCavitationSize()
    const id = window.location.hash.slice(1) || 'origin'
    if (virtualMap.length) {
      let el = document.getElementById(id)
      if (el) {
        CS.cmd.focus(id)
        setTimeout(() => {
          scrollIntoView(id, true)
          loader = false
        }, 0)
      }
    } else {
      loader = false
    }

    return monitorPinchZoom((zoom: -1 | 1) => {
      CS.cmd.shiftZoom(zoom)
    })
  })

  function handleHashChange(ev: Event, id: string) {
    console.log('HASH CHANGE!')
    ev.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      // CS.cmd.focus(id)
      // scrollIntoView(id)
    }
  }

  function scrollIntoView(id: string, instant = false) {
    const el = document.getElementById(id)
    if (el) {
      // const { height } = el.offsetHeight
      const block =
        el.parentElement!.offsetHeight > window.innerHeight ? 'start' : 'center'
      el.scrollIntoView({
        behavior: instant ? 'instant' : 'smooth',
        block,
        inline: 'center',
      })
    }
  }

  let wheelTimestamp = 0
  let lastShiftCommand = 0
  const ZOOM_ANIMATION_DURATION = 0
  function handleContainerWheel(ev: WheelEvent) {
    if (!CS.edgeScrollMode && !ev.ctrlKey) return
    ev.preventDefault()

    const lastShiftZoomDelta = ev.timeStamp - lastShiftCommand
    const timestampDelta = ev.timeStamp - wheelTimestamp
    if (
      lastShiftZoomDelta > ZOOM_ANIMATION_DURATION &&
      timestampDelta > 5 &&
      Math.abs(ev.deltaY) > 1
    ) {
      wheelTimestamp = ev.timeStamp
      const zoomDelta = ev.deltaY > 0 ? 1 : -1

      if (CS.cmd.shiftZoom(zoomDelta, ev.clientX, ev.clientY)) {
        lastShiftCommand = ev.timeStamp
      }
    }
  }

  function handleClick(ev: MouseEvent) {
    let el = ev.target

    // Accounts for SPAN inside A
    if (!(el instanceof HTMLAnchorElement))
      el = (el as HTMLElement).parentElement

    if (el instanceof HTMLAnchorElement) {
      const url = new URL(el.href)
      if (url.hash && url.host === window.location.host) {
        ev.preventDefault()
        ev.stopPropagation()
        if (justPanned > 5) return
        focusOn(el.hash.slice(1))
      }
    }
  }

  export function focusOn(id: string) {
    if (document.getElementById(id)) {
      CS.cmd.focus(id)
      history.pushState(null, '', `#${id}`)
      scrollIntoView(id)
    }
  }

  // let pan = $state<{ x: number; y: number }>({ x: 0, y: 0 })
  let pan = $state(false)
  function handleMouseDown(ev: MouseEvent) {
    if (ev.button === 1) {
      if (!(ev.target instanceof HTMLAnchorElement)) {
        ev.preventDefault()
        CS.cmd.toggleEdgeScrollMode()
      }
    } else if (ev.button === 0 && !isTouchDevice) {
      pan = true
    }
  }

  let justPanned = $state(0)
  function handleMouseMove(ev: MouseEvent) {
    if (pan) {
      justPanned += Math.abs(ev.movementX) + Math.abs(ev.movementY)
      scrollContainer.scrollLeft -= ev.movementX
      scrollContainer.scrollTop -= ev.movementY
    }
  }

  function handleMouseUp(ev: MouseEvent) {
    if (ev.button === 0 && pan) {
      pan = false
      setTimeout(() => {
        justPanned = 0
      }, 100)
    }
  }

  function handleKeyDown(ev: KeyboardEvent) {
    if (ev.key.startsWith('Arrow')) {
      // if (CS.focus) {
      //   const frame =
      //   if (ev.key === 'ArrowLeft') {
      //   }
      // }
    }
  }

  let lastMoveEv: 'canvas' | 'edge' = 'canvas'
  function handleEdgeScrollFrameDetect(direction: number) {
    if (lastMoveEv === 'canvas') {
      lastMoveEv = 'edge'
    }
    CS.cmd.informEdgeScroll(direction)
  }

  function handleCanvasMouseMove(ev: MouseEvent) {
    if (lastMoveEv === 'edge') {
      lastMoveEv = 'canvas'
      CS.cmd.informEdgeScroll(null)
    }
  }

  $effect(() => {
    if (pan) {
      document.body.classList.add('cursor-grabbing', 'select-none')
    } else {
      document.body.classList.remove('cursor-grabbing', 'select-none')
    }
  })

  let loader = $state(true)

  function handleScroll() {
    const y = scrollContainer.scrollTop
    const x = scrollContainer.scrollLeft
    const w = window.innerWidth
    const h = window.innerHeight
    viewportFocus = { x, y, w, h }
  }
</script>

<svelte:window
  onhashchange={(ev) => handleHashChange(ev, window.location.hash.slice(1))}
  onclick={handleClick}
  ondblclick={recalculateCavitationSize}
  onmousedown={handleMouseDown}
  onmousemove={handleMouseMove}
  onmouseup={handleMouseUp}
  onkeydown={handleKeyDown}
  ondragstart={(ev) => ev.preventDefault()}
/>

{#if CS.edgeScrollMode}
  <EdgeScrollFrame
    thickness={50}
    hue={100}
    ondetect={handleEdgeScrollFrameDetect}
  />
  {#if CS.edgeScrollDirection !== null}
    <BlobDirectionIndicator
      hue={100}
      class="absolute top-1/2 left-1/2 -translate-1/2 z-200 w50 h50 pointer-events-none text-green-400"
      direction={CS.edgeScrollDirection}
    />
  {/if}
{/if}

{#if CS.showMinimap}
  <div
    class="absolute bottom-2 left-2 z-9999 p2 bg-gray-900 b b-white rounded-md"
  >
    <MiniMap
      cavitationSize={CS.cavitationSize}
      {viewportFocus}
      zoom={CS.zoom}
      origin={CS.originPosition}
      elements={virtualMap}
      focused={CS.focus}
      containerSize={{ w: 300, h: 300 }}
    />
  </div>
{/if}

<div
  bind:this={scrollContainer}
  id="scroll-container"
  onwheel={handleContainerWheel}
  onmousemove={handleCanvasMouseMove}
  onscroll={handleScroll}
  role="presentation"
  class="relative h-full w-full bg-black overflow-auto no-scrollbar"
>
  <div
    class="absolute left-0 top-0"
    style={`background-image: url(${background}); background-size: ${320 * CS.zoom}px ${200 * CS.zoom}px; width: ${CS.cavitationSize.w * CS.zoom}px; height: ${CS.cavitationSize.h * CS.zoom}px;`}
  ></div>

  {#if loader}
    <div
      class="fixed inset-0 z-9999 bg-black pointer-events-none"
      out:fade
    ></div>
  {/if}
  <div
    bind:this={cavitationContainer}
    id="cavitation-container"
    class="relative max-w-none max-h-none overflow-hidden"
  >
    <div
      bind:this={originContainer}
      id="origin-container"
      class={cx('absolute w-0 h-0', {})}
    >
      <!-- <Pin id="center" pos={{ x: -1552, y: -1108 }}>
        <div
          class="h-10 w-10 -transform-1/2 bg-red-500 rounded-full z-99999 absolute"
        ></div>
      </Pin> -->
      {@render children()}
    </div>
  </div>
</div>

<style global>
  .no-scrollbar {
    scrollbar-width: 0;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
</style>
