<script lang="ts">
  import { onMount } from 'svelte'
  import type { ClassValue } from 'svelte/elements'

  type Routine = { make: () => void; animate: (time: number) => void }

  const props: {
    routines: (canvas: {
      ctx: CanvasRenderingContext2D
      h: number
      w: number
    }) => Routine[]
    animate: boolean
    class?: ClassValue
  } = $props()

  let canvas: HTMLCanvasElement

  const BG_COLOR = 'transparent'

  onMount(() => {
    const ctx = canvas.getContext('2d')!
    let w: number, h: number

    let routines: { make: () => void; animate: (time: number) => void }[] = []

    function resize() {
      const height = canvas.offsetHeight
      const width = canvas.offsetWidth
      // const { width, height } = canvas.getBoundingClientRect()
      w = width
      h = height
      canvas.width = w
      canvas.height = h

      routines = props.routines({ ctx, w, h })

      routines.forEach((r) => r.make())
    }

    function draw(time: number) {
      ctx.fillStyle = BG_COLOR

      routines.forEach((r) => r.animate(time))

      if (props.animate) {
        requestAnimationFrame(draw)
      }
    }

    resize()
    draw(0)

    window.addEventListener('resize', resize)
  })
</script>

<canvas
  bind:this={canvas}
  class={['absolute top-0 left-0 size-full', props.class]}
></canvas>
