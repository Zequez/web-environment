<script lang="ts">
  import { cx } from '@/center/utils'
  // import draggable from './draggable.svelte'
  import framesStore, {
    type DoorwayPosition,
    type Tunnels,
  } from './frames-store.svelte'
  import rootStore from '../lib/root-store.svelte'

  const {
    z,
    positioning,
    id,
    tunnels,
  }: { z: number; positioning: string; id: string; tunnels: Tunnels } = $props()
  const FS = framesStore.getContext()
  const RS = rootStore.getContext()

  // const DRAG = draggable(
  //   () => {},
  //   ({ dx, dy }) => {},
  //   () => {},
  // )

  function handleDoorwayClick(position: DoorwayPosition, ev: MouseEvent) {
    if (FS.tunnelingFrom) {
      FS.cmd.endTunnel(id, position)
    } else {
      FS.cmd.startTunnel(id, position)
    }
  }

  function handleDoorwayClear(position: DoorwayPosition, ev: MouseEvent) {
    if (ev.button === 1) {
      FS.cmd.removeTunnel(id, position)
      ev.preventDefault()
      ev.stopPropagation()
    }
  }
</script>

{#snippet doorwayText(position: DoorwayPosition, klass: string)}
  {@const toId = tunnels[position]}
  {@const tempted =
    position[0] === RS.tentativeTunnel || position[1] === RS.tentativeTunnel}
  {@const baseClass =
    'bg-black absolute b b-white px.5 py.25 text-white text-xs pointer-events-auto'}
  {#if toId}
    {@const toText = FS.framesTitlesById[toId]}
    <a
      onmousedown={handleDoorwayClear.bind(null, position)}
      aria-label="Doorway to {toText}"
      href={`#${toId}`}
      class={cx(
        klass,
        baseClass,
        'rounded-[4px] text-center hover:(text-yellow-400 b b-yellow-400)',
        { 'text-yellow-400 b b-yellow-400 scale-120': tempted },
      )}
    >
      {toText}
    </a>
  {:else if RS.tunnelingOverlay}
    {@const isTunnelingFrom =
      FS.tunnelingFrom?.id === id && FS.tunnelingFrom?.position === position}
    <button
      onclick={handleDoorwayClick.bind(null, position)}
      aria-label="Tunnel into {position}"
      class={cx(
        klass,
        baseClass,
        'h10 w10 rounded-full transition-border flexcc uppercase',
        {
          'b-14 b-yellow-400': isTunnelingFrom,
          'b-2 b-white  hover:(b-yellow-400 b-6)': !isTunnelingFrom,
        },
      )}
    ></button>
  {/if}
{/snippet}

<!-- <div
  class="absolute -inset-x-4 -inset-y-2 -bottom-3 ml-4 pointer-events-none"
  style={`transform: ${positioning}; z-index: ${z - 1};`}
>
  {@render doorway(
    'top-0 left-0 bg-gray-500 hover:(-mt4 -ml4) cursor-nw-resize rounded-tl-md',
  )}
  {@render doorway('top-0 left-1/3 bg-gray-400 hover:-mt4 cursor-n-resize')}
  {@render doorway(
    'top-0 right-0 bg-gray-400 hover:(-mt4 -mr4) cursor-ne-resize rounded-tr-md',
  )}
  {@render doorway('top-1/3 right-0 bg-gray-500 hover:-mr4 cursor-e-resize')}
  {@render doorway(
    'bottom-0 right-0 bg-gray-400 hover:(-mb4 -mr4) cursor-se-resize rounded-br-md',
  )}
  {@render doorway('bottom-0 left-1/3 bg-gray-500 hover:-mb4 cursor-s-resize')}
  {@render doorway(
    'bottom-0 left-0 bg-gray-400 hover:(-mb4 -ml4) cursor-sw-resize rounded-bl-md',
  )}
  {@render doorway('bottom-1/3 left-0 bg-gray-500 hover:-ml4 cursor-w-resize')}
</div> -->

<div
  class="absolute -inset-x-4 -inset-y-2 -bottom-3 ml-4 pointer-events-none"
  style={`transform: ${positioning}; z-index: ${z + 1};`}
>
  {@render doorwayText('nw', 'top-0 left-0 cursor-nw-resize')}
  {@render doorwayText(
    'nn',
    'top-0 left-1/2 -translate-x-1/2 cursor-n-resize max-w-1/3',
  )}
  {@render doorwayText('ne', 'top-0 right-0  cursor-ne-resize ')}
  {@render doorwayText(
    'ee',
    'top-1/2 left-1/1 -translate-y-1/2  cursor-e-resize -ml4 ',
  )}
  {@render doorwayText('se', 'bottom-0 right-0 cursor-se-resize')}
  {@render doorwayText(
    'ss',
    'bottom-0 left-1/2 cursor-s-resize -translate-x-1/2 max-w-1/3',
  )}
  {@render doorwayText('sw', 'bottom-0 left-0 cursor-sw-resize')}
  {@render doorwayText(
    'ww',
    'top-1/2 right-1/1 -mr4 cursor-w-resize -translate-y-1/2',
  )}
</div>
