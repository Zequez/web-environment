<script lang="ts">
  import IconMove from '~icons/fa6-solid/arrows-up-down-left-right'

  import { cx } from '@/center/utils'

  import rootStore from '../lib/root-store.svelte'
  import frameStore, { type FullFrontmatter } from './frames-store.svelte'
  import draggable from './draggable.svelte'

  const RS = rootStore.getContext()
  const FS = frameStore.getContext()

  const {
    id,
    p,
    isDragging,
    draggingHandler,
  }: {
    id: string
    p: FullFrontmatter
    isDragging: boolean
    draggingHandler: (ev: MouseEvent) => void
  } = $props()

  function toggleHidden() {
    FS.cmd.updateProps(id, { hidden: !p.hidden })
  }
</script>

{#if RS.editMode}
  <div
    style={`--grid-bg: ${p.draft ? '#9ca3af' : '#60a5fa'};`}
    ondblclick={toggleHidden}
    onmousedown={(ev) => ev.shiftKey && draggingHandler(ev)}
    role="presentation"
    class={cx(
      'grid-bg',
      'h10 absolute peer top-0 left-0 w-full -mt12 min-w-200px flexcs px2 text-xs rounded-md space-x-2 b-black/10 pointer-events-auto',
      {
        ' shadow-[0_1.1px_0px_2px_#6B7381]': p.draft,
        ' shadow-[0_1.1px_0px_2px_#437CC3]': !p.draft,
      },
    )}
  >
    <span class="font-mono">{id}</span>
    <div class="line-height-2 font-mono text-[8px]">
      <div>X {p.x.toFixed(0)}</div>
      <div>Y {p.y.toFixed(0)}</div>
    </div>
    <div>{p.layer}</div>
    <div class="flex-grow"></div>
    <label>
      <input
        type="checkbox"
        class="peer w0 h0 opacity-0"
        checked={p.draft}
        onchange={(ev) => {
          FS.cmd.updateProps(id, {
            draft: ev.currentTarget.checked,
          })
        }}
      />
      <span
        class="bg-gray-300 b-2 b-black/10 b-dashed text-black/20 rounded-md px1 py.5 peer-checked:(bg-blue-400 b-solid text-white) cursor-pointer"
      >
        Draft
      </span>
    </label>
    <div
      role="button"
      aria-grabbed={isDragging}
      tabindex={0}
      aria-label="Drag handle for moving element"
      onmousedown={draggingHandler}
      class="text-white/80 text-lg cursor-move hover:(text-white/100 scale-110) transition-transform"
    >
      <IconMove />
    </div>
    {#if !p.hidden && p.layer === 'fg'}
      <div
        class={cx('absolute top-full -left-2 w-full -z-1 h-4 saturate-50', {
          'bg-gray-400': p.draft,
          'bg-blue-400': !p.draft,
        })}
      ></div>
    {/if}
  </div>
{/if}

<style>
  .grid-bg {
    /* Tunables */
    --grid-bg: transparent; /* backdrop color */
    --grid-size: 12px; /* size of each cell */
    --grid-line-width: 1px; /* line thickness */
    --grid-line-alpha: 0.2; /* line opacity (0..1) */
    --grid-offset-x: 0px; /* scroll/offset support */
    --grid-offset-y: 0px;

    /* Optional major grid (thicker/brighter every n cells) */
    --grid-major: 0; /* every n cells */
    --grid-major-width: 1px;
    --grid-major-alpha: 0.2;

    background-color: var(--grid-bg);

    /* 4 layers: minor vertical, minor horizontal, major vertical, major horizontal */
    background-image:
      linear-gradient(
        to right,
        rgba(255, 255, 255, var(--grid-line-alpha)) 0,
        rgba(255, 255, 255, var(--grid-line-alpha)) var(--grid-line-width),
        transparent var(--grid-line-width),
        transparent 100%
      ),
      linear-gradient(
        to bottom,
        rgba(255, 255, 255, var(--grid-line-alpha)) 0,
        rgba(255, 255, 255, var(--grid-line-alpha)) var(--grid-line-width),
        transparent var(--grid-line-width),
        transparent 100%
      ),
      linear-gradient(
        to right,
        rgba(255, 255, 255, var(--grid-major-alpha)) 0,
        rgba(255, 255, 255, var(--grid-major-alpha)) var(--grid-major-width),
        transparent var(--grid-major-width),
        transparent 100%
      ),
      linear-gradient(
        to bottom,
        rgba(255, 255, 255, var(--grid-major-alpha)) 0,
        rgba(255, 255, 255, var(--grid-major-alpha)) var(--grid-major-width),
        transparent var(--grid-major-width),
        transparent 100%
      );

    background-size:
      var(--grid-size) 100%,
      /* minor vertical */ 100% var(--grid-size),
      /* minor horizontal */ calc(var(--grid-size) * var(--grid-major)) 100%,
      /* major vertical */ 100% calc(var(--grid-size) * var(--grid-major)); /* major horizontal */

    background-position:
      var(--grid-offset-x) 0,
      0 var(--grid-offset-y),
      var(--grid-offset-x) 0,
      0 var(--grid-offset-y);

    /* Prevent smoothing on some browsers when scaled */
    image-rendering: pixelated;
  }

  /* Optional: darker backdrop preset */
  .grid-bg.on-dark {
    --grid-bg: #0b0b0b;
    --grid-line-alpha: 0.15;
    --grid-major-alpha: 0.32;
  }

  /* Optional: dot-grid variant (swap the class) --------------------------- */
  .grid-bg-dots {
    --grid-bg: transparent;
    --grid-size: 20px;
    --dot-size: 2px;
    --dot-alpha: 0.4;
    --grid-offset-x: 0px;
    --grid-offset-y: 0px;

    background-color: var(--grid-bg);
    /* radial-gradient makes dots; second layer offsets by half-cell to feel balanced */
    background-image:
      radial-gradient(
        circle at center,
        rgba(255, 255, 255, var(--dot-alpha)) 0,
        rgba(255, 255, 255, var(--dot-alpha)) var(--dot-size),
        transparent var(--dot-size),
        transparent 100%
      ),
      radial-gradient(
        circle at center,
        rgba(255, 255, 255, calc(var(--dot-alpha) * 0.5)) 0,
        rgba(255, 255, 255, calc(var(--dot-alpha) * 0.5)) var(--dot-size),
        transparent var(--dot-size),
        transparent 100%
      );
    background-size: var(--grid-size) var(--grid-size);
    background-position:
      var(--grid-offset-x) var(--grid-offset-y),
      calc(var(--grid-offset-x) + var(--grid-size) / 2)
        calc(var(--grid-offset-y) + var(--grid-size) / 2);

    image-rendering: pixelated;
  }
</style>
