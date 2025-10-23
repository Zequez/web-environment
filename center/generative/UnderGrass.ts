export default function generateUnderGrass(canvas: {
  ctx: CanvasRenderingContext2D
  w: number
  h: number
}) {
  // canvas: {ctx, w, h}

  let config = {
    layers: [
      {
        color: '#55230f',
        blobsDensity: 3,
        blobsSize: 3,
        raggedness: 0,
        height: 6,
      },
      {
        color: '#7f331d',
        blobsDensity: 15,
        blobsSize: 2,
        raggedness: 4,
        height: 8,
      },
      {
        color: '#924429',
        blobsDensity: 10,
        blobsSize: 2,
        raggedness: 5,
        height: 12,
      },
      {
        color: '#c47343',
        blobsDensity: 10,
        blobsSize: 3,
        raggedness: 5,
        height: 30,
      },
    ],
  }

  function make() {
    const { ctx, w, h } = canvas
    let yOffset = 0

    let allHeight = config.layers.reduce((a, l) => a + l.height, 0)

    for (const layer of config.layers) {
      const i = config.layers.indexOf(layer)

      // if (i > 1) continue

      const layerHeight = (layer.height / allHeight) * h
      const yTop = yOffset
      const yBottom = yOffset + layerHeight
      yOffset += layerHeight

      // === Draw wavy layer ===
      ctx.beginPath()
      ctx.moveTo(0, yTop)

      // Create top boundary (sine-like ragged)

      let shift = Math.random() * 2
      for (let x = 0; x <= w + 10; x += Math.random() * 10) {
        const y =
          yTop +
          Math.sin(shift + x * 0.07 + Math.random() * 0.6) *
            (layer.raggedness * 0.3)
        ctx.lineTo(x, y)
      }

      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.closePath()
      ctx.fillStyle = layer.color
      ctx.fill()

      // === Add darker blobs ===
      const blobCount = Math.floor(
        (w * layerHeight * layer.blobsDensity) / 10000,
      )
      ctx.fillStyle = darken(layer.color, Math.random() * 0.1 + 0.05) // darker shade helper
      for (let i = 0; i < blobCount; i++) {
        const bx = Math.random() * w
        const by = yTop + Math.random() * layerHeight
        const br = layer.blobsSize + Math.random() * layer.blobsSize
        ctx.beginPath()
        ctx.arc(bx, by, br, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // Helper to darken a hex color by factor (0–1)
  function darken(hex: string, factor: number) {
    const num = parseInt(hex.slice(1), 16)
    let r = (num >> 16) & 255
    let g = (num >> 8) & 255
    let b = num & 255
    r = Math.max(0, Math.floor(r * (1 - factor)))
    g = Math.max(0, Math.floor(g * (1 - factor)))
    b = Math.max(0, Math.floor(b * (1 - factor)))
    return `rgb(${r}, ${g}, ${b})`
  }

  function animate(time: number) {}
  return { make, animate }
}
