<script lang="ts">
  import { getContext, onMount } from 'svelte'
  import { cx } from '@/center/utils'
  import framesStore, { type FullFrontmatter } from './frames-store.svelte'
  import rootStore from '../lib/root-store.svelte'
  import canvasStore, {
    STANDARD_FRAME_WIDTH,
  } from '../../../center/canvas/canvas-store.svelte'
  import IconMove from '~icons/fa6-solid/arrows-up-down-left-right'
  import Doorways from './Doorways.svelte'
  import HandlingBar from './HandlingBar.svelte'
  import draggable from './draggable.svelte'

  const {
    id,
    p,
    children,
  }: {
    id: string
    p: FullFrontmatter
    children: any
  } = $props()

  const RS = rootStore.getContext()
  const FS = framesStore.getContext()
  const CS = canvasStore.getContext()
  const isDevMode = import.meta.env.DEV

  // let topZ = $state<null | number>(null)
  const DRAG = draggable(
    () => {
      FS.cmd.setDraggingId(id)
    },
    ({ dx, dy }) => {
      FS.cmd.updateProps(id, {
        x: p.x + dx,
        y: p.y + dy,
      })
    },
    () => {
      FS.cmd.setDraggingId(null)
      FS.cmd.updateProps(id, {
        z: FS.topZ + 1,
      })
      FS.cmd.commitProps(id)
    },
  )

  let container = $state<HTMLDivElement>(null!)
  let isSelected = $derived(CS.focus === id)

  let zIndex = $derived(
    p.layer === 'bg'
      ? 18
      : FS.draggingId === id
        ? 20 + FS.topZ + 2
        : FS.hoveringId === id
          ? 20 + FS.topZ + 1
          : 20 + p.z,
  )
  let positioning = 'translateX(-50%)'
  let posStyle = $derived(`transform: ${positioning}; z-index: ${zIndex};`)
</script>

{#if !p.draft || isDevMode}
  {#if p.layer === 'fg'}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_mouse_events_have_key_events -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      bind:this={container}
      class={cx('pointer-events-auto relative', {
        'opacity-50': p.draft && !isSelected,
      })}
      onmouseenter={() => (!DRAG.dragging ? FS.cmd.hovering(id) : null)}
      onmousedown={(ev) => ev.shiftKey && DRAG.handleDragOnMouseDown(ev)}
      style={posStyle + `width: ${STANDARD_FRAME_WIDTH}px;`}
    >
      <HandlingBar
        {p}
        {id}
        draggingHandler={DRAG.handleDragOnMouseDown}
        isDragging={!!DRAG.dragging}
      />
      {#if !p.hidden}
        <div
          class={cx(`relative md w-full`, {
            'saturate-100 hover:brightness-120': !isSelected,
          })}
        >
          {#if !isSelected}
            <a
              class="z-20 block absolute left-0 top-0 size-full bg-white/50 opacity-0 rounded-md bg-[url('/noise20.png')]"
              aria-label="Focus frame"
              onmousedown={(ev) =>
                ev.shiftKey && DRAG.handleDragOnMouseDown(ev)}
              href={`#${id}`}
            ></a>
          {:else}
            <div
              class="absolute -inset-2 b-3 blur-sm b-yellow-300 b-dashed rounded-lg z-9 bg-yellow-300/20 pointer-events-none"
            ></div>
            <div
              class="absolute -inset-2 b-3 b-yellow-300 b-dashed rounded-lg z-9 pointer-events-none"
            ></div>
          {/if}

          <div
            class={cx(
              'relative z-10 p4 md bg-gray-100 rounded-md shadow-[0_1.5px_0px_2px_#888]',
            )}
          >
            {@render children()}
          </div>
        </div>
      {/if}
    </div>
    {#if isSelected || RS.tunnelingOverlay}
      <Doorways z={20 + FS.topZ + 1} {positioning} {id} tunnels={p.tunnels} />
    {/if}
  {:else}
    <div
      bind:this={container}
      style={posStyle}
      role="presentation"
      class={cx(`pointer-events-none relative`)}
    >
      <HandlingBar
        {p}
        {id}
        draggingHandler={DRAG.handleDragOnMouseDown}
        isDragging={!!DRAG.dragging}
      />
      <div
        class={cx(
          'hidden peer-hover:block absolute -inset-3px b-3 b-blue-400 rounded-md b-dashed',
          {},
        )}
      ></div>
      <div class={cx({ 'invisible pointer-events-none': p.hidden })}>
        {@render children()}
      </div>
    </div>
  {/if}
{/if}
