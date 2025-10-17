<script lang="ts">
  import './markdown.css'

  import { onMount, setContext, type Component } from 'svelte'
  import favicon from '@@@/photos/favicon.jpg'
  import noise from '@@@/photos/noise.png'

  import { Canvas } from '@/center/canvas'

  import FramesLister from './frames/FramesLister.svelte'
  import type { Tunnels } from './frames/frames-store.svelte'
  import api from './lib/api.svelte'
  import rootStore from './lib/root-store.svelte'
  import { cx } from '@/center/utils'
  import LinkIcon from '~icons/fa6-solid/link'
  import ExpandIcon from '~icons/fa6-solid/expand'
  import CompressIcon from '~icons/fa6-solid/compress'
  import PenIcon from '~icons/fa6-solid/pen'
  import ImageIcon from '~icons/fa6-solid/image'
  import EdgeScrollIcon from '~icons/fa6-solid/border-none'
  import PlusIcon from '~icons/fa6-solid/plus'
  import MinusIcon from '~icons/fa6-solid/minus'
  import BarsIcon from '~icons/fa6-solid/bars'
  import MinimapIcon from '~icons/fa6-solid/map'
  import framesStore from './frames/frames-store.svelte'
  import canvasStore from '@/center/canvas/canvas-store.svelte'

  const API = api()

  setContext('api', API)

  let RS = rootStore.initContext({})
  let FS = framesStore.initContext({})
  let CS = canvasStore.initContext({})

  // const structuredFrames = $derived(
  //   Object.entries(FS.extendedFmById)
  //     .filter(([id, fm]) => fm.layer === 'fg')
  //     .map(([id, fm]) => ({
  //       id,
  //       x: fm.x * 0.1,
  //       y: fm.y * 0.2,
  //       linksTo: Object.values(fm.tunnels).filter((v) => v),
  //       title: fm.title,
  //     })),
  // )

  type SecondTunnel = {
    n?: string
    e?: string
    s?: string
    w?: string
  }

  let menuOpen = $state<boolean>(false)

  function toggleMenu() {
    menuOpen = !menuOpen
  }

  let nextTunneling: SecondTunnel | null = null
  let shiftCount = 0
  let shiftTimeout: any = null
  function handleWindowKeydown(ev: KeyboardEvent) {
    if (ev.key === 'Shift') {
      shiftCount++
      if (shiftCount >= 3) {
        RS.cmd.toggleEditMode()
        shiftCount = 0
        clearTimeout(shiftTimeout)
      } else {
        clearTimeout(shiftTimeout)
        shiftTimeout = setTimeout(() => {
          shiftCount = 0
        }, 1000)
      }
    }

    if (ev.key.startsWith('Arrow')) {
      ev.preventDefault()
      const focusedFrameId = canvasRef.context.focus
      if (focusedFrameId) {
        const frame = framesRef.context.frames.find(
          (f) => f.id === focusedFrameId,
        )
        if (frame) {
          const tunnels = frame.fm.tunnels
          const direction = keyToTunnelDirection(ev.key)
          if (direction) {
            if (!nextTunneling) {
              const filteredTunnels = filterTunnelsByDirection(
                tunnels,
                direction,
              )
              const possibilities = Object.values(filteredTunnels)
              if (possibilities.length === 1) {
                canvasRef.focusOn(possibilities[0])
                nextTunneling = null
                RS.cmd.temptTunnel(null)
              } else if (possibilities.length > 1) {
                nextTunneling = filteredTunnels
                RS.cmd.temptTunnel(direction)
              }
            } else {
              if (nextTunneling[direction]) {
                canvasRef.focusOn(nextTunneling[direction])
              }
              nextTunneling = null
              RS.cmd.temptTunnel(null)
            }
          }
        }
      }
    }
  }

  function filterTunnelsByDirection(tunnels: Tunnels, direction: string) {
    return Object.fromEntries(
      Object.entries(tunnels)
        .filter(([k, v]) => k[0] === direction || k[1] === direction)
        .map(([k, v]) => [k.replace(direction, ''), v]),
    )
  }

  function keyToTunnelDirection(key: string) {
    switch (key) {
      case 'ArrowLeft':
        return 'w'
      case 'ArrowRight':
        return 'e'
      case 'ArrowUp':
        return 'n'
      case 'ArrowDown':
        return 's'
    }
  }

  let canvasRef = $state<Canvas>(null!)
  let framesRef = $state<FramesLister>(null!)

  function fullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }

  let onFullscreen = $state(false)
  onMount(() => {
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        onFullscreen = true
      } else {
        onFullscreen = false
      }
    })
  })

  let framesByAphabeticalOrder = $derived.by(() => {
    return FS.frames
      .filter((f) => f.fm.layer === 'fg' && !f.fm.hidden && !f.fm.draft)
      .sort(({ fm: { title: aa } }, { fm: { title: bb } }) => {
        return aa.toLocaleLowerCase().localeCompare(bb.toLocaleLowerCase())
      })
  })
  let sortedFramesIds = $derived(framesByAphabeticalOrder.map((f) => f.id))
  let focusFrameIndex = $derived(
    CS.focus ? sortedFramesIds.indexOf(CS.focus) : null,
  )
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<svelte:head>
  <title>Ezequiel A. Schwartzman</title>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no"
  />
  <!-- Favicon -->
  <link rel="icon" type="image/png" href={favicon} />
</svelte:head>
<!--
<div class="absolute top-0 left-0 w-600px h-600px z-999999">
  <StructuredIndex frames={structuredFrames} />
</div> -->

<!-- bg-[hsl(100deg_100%_100%)] -->
{#if canvasRef}
  {#if canvasRef.context.focus}
    <!-- <button onclick={() => toggleMenu()}></button> -->
    <div
      class={cx(
        'fixed z-999 bottom-0 left-1/2 -translate-x-1/2 flex flex-col bg-gray-900 rounded-t-md overflow-hidden',
      )}
    >
      <div
        class="transition-[transform,height] w-full transition-duration-700"
        style={`transform: translateY(${menuOpen ? 0 : -focusFrameIndex! * 24}px); height: ${menuOpen ? 24 * framesByAphabeticalOrder.length : 24}px;`}
      >
        {#each framesByAphabeticalOrder as { id, fm: { title } }, i (id)}
          <button
            class={cx(
              'relative hover:bg-gray-800 text-white px2 py1 uppercase text-xs font-bold flexcc px7 w-full whitespace-nowrap',
            )}
            onclick={(ev) => {
              if (menuOpen) {
                canvasRef.focusOn(id)
              }
              toggleMenu()
            }}
          >
            {#if i === focusFrameIndex}
              <div class="absolute top-0 left-.5 flexcc h6 w5">
                <BarsIcon class="text-[14px]" />
              </div>
            {/if}
            {title}
          </button>
        {/each}
      </div>
      <!-- <button
        class=" hover:bg-gray-800 text-white px2 py1 uppercase text-xs font-bold flexcc"
        onclick={(ev) => toggleMenu()}
      >
        <BarsIcon class="text-lg mr2" />
        {canvasRef.context.focus}
      </button> -->
      <!-- <div
        class={cx('0', {
          'h-20': menuOpen,
        })}
      ></div> -->
    </div>
  {/if}

  <div
    class="absolute top-4 right-4 bg-gray-900 b b-white/20 shadow-sm rounded-lg space-x-1.5 z-999 p1.5 hidden sm:flex"
  >
    {#snippet MegaBtn(
      Icon: Component,
      title: string,
      active: boolean,
      onClick: () => void,
      klass: string,
    )}
      <button
        {title}
        class={cx(
          'flexcc',
          'w10 h10 active:(shadow-[inset_0_1px_0_#fffa,inset_0_-1px_0_#0005] mt1.5px mb0) mb1.5px relative rounded-lg bg-gradient-to-b from-white/10 to-white/0 shadow-[0_1.5px_0_1px_var(--shadow-color),inset_0_1px_0_#fffa] font-bold  text-gray-100',
          klass,
          {
            'opacity-100': active,
            'opacity-75 hover:saturate-50 saturate-0': !active,
          },
        )}
        onclick={() => onClick()}
      >
        <div class="relative z-10"><Icon /></div>
        <div class="text-black absolute inset-0 flexcc z-9 mt.5">
          <Icon />
        </div>
      </button>
    {/snippet}

    <div class="text-white flex flex-col space-y-1">
      <button
        class="w4.5 h4.5 rounded-full bg-slate-300 text-slate-800 b-2 b-black/10 shadow-[0_1px_0_#0009] hover:(bg-slate-600 text-slate-300 scale-120) flexcc"
        onclick={() => canvasRef.context.cmd.shiftZoom(-1)}
      >
        <PlusIcon />
      </button>
      <button
        class="w4.5 h4.5 rounded-full bg-slate-300 text-slate-800 b-2 b-black/10 shadow-[0_1px_0_#0009] hover:(bg-slate-600 text-slate-300 scale-120) flexcc"
        onclick={() => canvasRef.context.cmd.shiftZoom(1)}
      >
        <MinusIcon />
      </button>
    </div>

    {@render MegaBtn(
      PenIcon,
      'Edit mode',
      RS.editMode,
      () => RS.cmd.toggleEditMode(),
      "bg-blue-400 [--shadow-color:theme('colors.blue.600')]",
    )}

    {@render MegaBtn(
      LinkIcon,
      'Tunneling overlay',
      RS.tunnelingOverlay,
      () => RS.cmd.toggleTunnelingOverlay(),
      "bg-yellow-400 [--shadow-color:theme('colors.yellow.600')]",
    )}

    {@render MegaBtn(
      ImageIcon,
      'Background mode',
      RS.backgroundMode,
      () => RS.cmd.toggleBackgroundMode(),
      "bg-pink-400 [--shadow-color:theme('colors.pink.600')]",
    )}

    {@render MegaBtn(
      MinimapIcon,
      'Minimap',
      canvasRef.context.showMinimap,
      () => canvasRef.context.cmd.toggleMinimap(),
      "bg-slate-400 [--shadow-color:theme('colors.slate.600')]",
    )}

    {@render MegaBtn(
      EdgeScrollIcon,
      'Edge Scroll Mode',
      canvasRef.context.edgeScrollMode,
      () => canvasRef.context.cmd.toggleEdgeScrollMode(),
      "bg-green-400 [--shadow-color:theme('colors.green.600')]",
    )}

    {@render MegaBtn(
      onFullscreen ? CompressIcon : ExpandIcon,
      'Fullscreen',
      onFullscreen,
      () => fullscreen(),
      "bg-teal-400 [--shadow-color:theme('colors.teal.600')]",
    )}
  </div>
{/if}
<Canvas background={noise} bind:this={canvasRef}>
  <FramesLister bind:this={framesRef} />
</Canvas>
