<script lang="ts">
  import { onMount } from 'svelte'

  const {
    ondetect,
    thickness,
    hue,
  }: {
    ondetect: (direction: number) => void
    thickness: number
    hue: number
  } = $props()

  let winSize = $state({ w: window.innerWidth, h: window.innerHeight })

  function handleResize() {
    winSize.w = window.innerWidth
    winSize.h = window.innerHeight
  }

  function generateSvgPath(innerMargin = 100, cornerRadius = 50) {
    const { w, h } = winSize

    const path = `
      M0,0
      H${w}
      V${h}
      H0
      Z
      M${innerMargin + cornerRadius},${innerMargin}
      H${w - innerMargin - cornerRadius}
      A${cornerRadius},${cornerRadius} 0 0 1 ${w - innerMargin},${innerMargin + cornerRadius}
      V${h - innerMargin - cornerRadius}
      A${cornerRadius},${cornerRadius} 0 0 1 ${w - innerMargin - cornerRadius},${h - innerMargin}
      H${innerMargin + cornerRadius}
      A${cornerRadius},${cornerRadius} 0 0 1 ${innerMargin},${h - innerMargin - cornerRadius}
      V${innerMargin + cornerRadius}
      A${cornerRadius},${cornerRadius} 0 0 1 ${innerMargin + cornerRadius},${innerMargin}
      Z
    `
    return path
  }

  function handleMouseMove(ev: MouseEvent) {
    const w = window.innerWidth
    const h = window.innerHeight
    const t = thickness * 2

    const x = ev.clientX
    const y = ev.clientY

    let direction: number

    // corners first
    if (x <= t && y <= t)
      direction = (-3 * Math.PI) / 4 // top-left
    else if (x >= w - t && y <= t)
      direction = -Math.PI / 4 // top-right
    else if (x <= t && y >= h - t)
      direction = (3 * Math.PI) / 4 // bottom-left
    else if (x >= w - t && y >= h - t)
      direction = Math.PI / 4 // bottom-right
    // sides
    else if (y <= t)
      direction = -Math.PI / 2 // top
    else if (y >= h - t)
      direction = Math.PI / 2 // bottom
    else if (x <= t)
      direction = Math.PI // left
    else direction = 0 // right

    ondetect(direction)
  }
</script>

<svelte:window onresize={handleResize} />

<div class="absolute inset-0 pointer-events-none z-200">
  <svg width="100vw" height="100vh" class="absolute inset-0">
    <path
      onmousemove={handleMouseMove}
      style="pointer-events: visiblePainted"
      role="presentation"
      d={generateSvgPath(thickness, thickness / 2)}
      fill="hsla({hue}, 100%, 70%,0.1)"
      fill-rule="evenodd"
    />
  </svg>
  <div
    style={`inset: ${thickness - 6}px; border-radius: ${thickness / 2 + 3}px; border-color: hsla(${hue}, 100%, 70%,0.7);`}
    class="absolute b-6 b-dashed"
  ></div>
</div>
