<script lang="ts">
  import { cx } from '@/center/utils'

  const {
    containerSize,
    viewportFocus,
    cavitationSize,
    zoom,
    origin,
    elements,
    focused,
  }: {
    containerSize: { w: number; h: number }
    viewportFocus: { x: number; y: number; w: number; h: number } | null
    cavitationSize: { w: number; h: number }
    zoom: number
    origin: { x: number; y: number }
    focused: string | null
    elements: {
      id: string
      title: string
      layer: string
      x: number
      y: number
      w: number
      h: number
    }[]
  } = $props()

  const cavitationAspectRatio = $derived(cavitationSize.w / cavitationSize.h)
  const containerAspectRatio = $derived(containerSize.w / containerSize.h)
  const scaleX = $derived(
    cavitationAspectRatio < containerAspectRatio
      ? containerAspectRatio / cavitationAspectRatio
      : 1,
  )
  const scaleY = $derived(
    cavitationAspectRatio < containerAspectRatio
      ? 1
      : containerAspectRatio / cavitationAspectRatio,
  )
  const w = $derived(cavitationSize.w * scaleX)
  const h = $derived(cavitationSize.h * scaleY)

  const scale = $derived(Math.min(containerSize.w / w, containerSize.h / h))

  let container = $state<HTMLDivElement>(null!)

  $effect(() => {
    elements
    container.childNodes.forEach((node) => {
      if (node.nodeType !== 1) return
      const a = node as HTMLAnchorElement
      const span = a.firstChild as HTMLSpanElement
      let exit = 0
      let fontSize = parseInt(span.style.fontSize, 10)
      while (a.scrollHeight > a.clientHeight + fontSize / 2 && exit < 10) {
        fontSize -= 1
        span.style.fontSize = fontSize + 'px'
        exit++
      }
    })
  })
</script>

<div
  style={`width: ${containerSize.w}px; height: ${containerSize.h}px;`}
  class="overflow-hidden flexcc"
>
  <div class="relative" style={`width: ${w * scale}px; height: ${h * scale}px`}>
    {#if viewportFocus}
      {@const el = viewportFocus}
      <div
        class="b b-white absolute"
        style={`left: ${(el.x * scale * scaleX) / zoom}px; top: ${(el.y * scale * scaleY) / zoom}px; width: ${(el.w * scale * scaleX) / zoom}px; height: ${(el.h * scale * scaleY) / zoom}px;`}
      ></div>
    {/if}
    <div
      class="absolute"
      style={`left: ${origin.x * scale * scaleX}px; top: ${origin.y * scale * scaleY}px;`}
      bind:this={container}
    >
      {#each elements as el (el.id)}
        {@const elW = el.w * scale * scaleX}
        {@const elH = el.h * scale * scaleY}
        {@const space = elW * elH}
        {@const fontSize = (space / (el.title.length * 0.8)) * 0.1}
        <a
          href={'#' + el.id}
          class={cx(
            'absolute rounded-sm p1px uppercase block break-all font-bold font-mono overflow-hidden text-center hover:bg-yellow-400',
            {
              'bg-gray-200': focused !== el.id,
              'bg-yellow-500': focused === el.id,
            },
          )}
          style={`left: ${el.x * scale * scaleX}px; top: ${el.y * scale * scaleY}px; width: ${elW}px; height: ${elH}px;`}
        >
          <span class="block line-height-0.9em" style={`font-size: 16px`}>
            {el.title}
          </span>
        </a>
      {/each}
    </div>
  </div>
</div>
