<script lang="ts">
  import { cx } from '@/center/utils'
  import type { SeparatorConfig } from './WebConfig'

  const separators = import.meta.glob('@/center/separators/*.svg', {
    eager: true,
    as: 'raw',
  }) as { [key: string]: string }

  const {
    config,
    index,
  }: {
    config: Exclude<SeparatorConfig, null>
    index: number
  } = $props()

  let isOn = $derived(config.snapTo === 'next' ? 'bottom' : 'top')
  let reverse = $derived(config.snapTo === 'next')
  let snappedSectionIndex = $derived(
    index + (config.snapTo === 'prev' ? -1 : 0),
  )
  let color = $derived(
    snappedSectionIndex % 2 === 1 ? 'text-main-400' : 'text-main-500',
  )

  const svg = $derived.by(() => {
    if (!separators[`'@/center/separators/${config.id}.svg`]) {
      throw `No SVG named ${config.id} on library`
    }

    return separators[`'@/center/separators/${config.id}.svg`]
  })

  const originalViewbox = $derived.by(() => {
    const m = svg.match(/viewBox="([^"]+)"/)
    return m![1].split(' ').map((v) => parseFloat(v)) as [
      number,
      number,
      number,
      number,
    ]
  })

  const shiftedViewbox = $derived.by(() => {
    if (!config.viewboxShift) return originalViewbox
    const base = [
      originalViewbox[2],
      originalViewbox[3],
      originalViewbox[2],
      originalViewbox[3],
    ]
    return config.viewboxShift.map(
      (v, i) => originalViewbox[i] + base[i] * (v / 100),
    )
  })

  const adjustedSvg = $derived.by(() => {
    if (!config.viewboxShift) return svg

    return svg.replace(
      /viewBox="([^"]+)"/,
      `viewBox="${shiftedViewbox.join(' ')}"`,
    )
  })

  let marginOuter = $derived(config.marginOuter || 0)
  let marginInner = $derived(config.marginInner || 0)
  let flip = $derived(config.flip != null ? config.flip : false)

  const viewBoxSize = $derived({
    w: shiftedViewbox[2],
    h: shiftedViewbox[3],
  })

  // const cavityOffset = $derived.by(() => {
  //   if (!svg) return null
  //   const m = svg.match(/data\-offset="(\d+)"/)
  //   if (!m) return 0
  //   return parseInt(m[1]) / 100
  // })

  const paddifiedHeight = $derived((viewBoxSize!.h / viewBoxSize!.w) * 100)
</script>

{#if svg && viewBoxSize}
  <div
    class={cx('w-full relative b-yellow z-10', color, {
      'scale-y-[-1]': config.snapTo === 'next',
      'scale-x-[-1]': config.flip,
      '-mb-1px': true,
    })}
  >
    {#if marginInner > 0}
      <div
        class="w-full bg-current"
        style="padding-top: {paddifiedHeight * marginInner + 0}%; "
      ></div>
    {/if}
    <!-- style={`transform: translateY(${reverse ? (1 - marginInner) * marginOuter * 100 : -marginInner! * 100}%) ${reverse ? 'scaleY(-1)' : 'scaleY(1)'} ${flip ? 'scaleX(-1)' : 'scaleX(1)'}`} -->
    <div
      class="absolute top-0 w-full"
      style={`transform: translateY(${marginInner * 100 - 5}%)`}
    >
      {@html adjustedSvg}
    </div>
    <div
      class="w-full b-cyan"
      style="padding-top: {paddifiedHeight *
        (1 + marginOuter + (marginInner < 0 ? marginInner : 0))}%;"
    ></div>
    <!-- {#if isOn === 'top'}
      <div
        class="w-full b-cyan"
        style="padding-top: {paddifiedHeight * (1 + marginOuter)}%;"
      ></div>
    {/if} -->
  </div>
{:else}
  <div
    class="h20 w-full bg-red-300 b-5 b-dashed b-red-400 text-white flexcc text-2xl"
  >
    ERROR: No SVG named {config.id} on library
  </div>
{/if}
