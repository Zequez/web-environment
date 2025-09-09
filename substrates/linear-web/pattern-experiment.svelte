<script lang="ts">
  import headerImage from './title.png'
  import { generatePattern } from './patterned-gen'

  let headerImageEl = $state<HTMLImageElement>(null!)
  let pattern = $state<string | null>(null)
  let patternSize = $state<number>(30)
  let patternPos = $state<{ x: number; y: number }>({ x: 179.5, y: 145 })
  let patternPreviewPos = $state<{ x: number; y: number }>({ x: 0, y: 0 })
  let previewingPattern = $state<boolean>(false)
  let resolvedPatternPos = $derived(
    previewingPattern ? patternPreviewPos : patternPos,
  )
  let hoveringImage = {}

  function handleImageMouseMover(ev: MouseEvent) {
    // Get XY position relative to image
    const rect = headerImageEl.getBoundingClientRect()
    const x = ev.clientX - rect.left
    const y = ev.clientY - rect.top
    patternPreviewPos = { x, y }
  }

  $effect(() => {
    generatePattern(headerImageEl, {
      type: 'honeycomb',
      size: patternSize,
      x: resolvedPatternPos.x,
      y: resolvedPatternPos.y,
      rotation: 0,
    }).then((val) => {
      pattern = val
    })
  })
</script>

<div class="flexcc h-350px">
  <div class="relative">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <h1>
      <img
        src={headerImage}
        alt="Example"
        class="max-w-100 relative z-9 text-8xl text-white font-serif text-center"
        width="500"
        height="333"
        bind:this={headerImageEl}
        onmouseenter={() => (previewingPattern = true)}
        onmouseleave={() => (previewingPattern = false)}
        onmousemove={handleImageMouseMover}
        onclick={() => {
          patternPos = patternPreviewPos
          console.log(patternPos)
        }}
      />
    </h1>
    {#if previewingPattern}
      <div
        class="absolute -translate-1/2 z-10 b b-red pointer-events-none"
        style={`width: ${patternSize}px; height: ${patternSize}px; top: ${resolvedPatternPos.y}px; left: ${resolvedPatternPos.x}px;`}
      ></div>

      <div
        class="absolute -translate-1/2 z-10 b b-white pointer-events-none"
        style={`width: ${patternSize}px; height: ${patternSize}px; top: ${patternPos.y}px; left: ${patternPos.x}px;`}
      ></div>
    {/if}
  </div>
</div>
