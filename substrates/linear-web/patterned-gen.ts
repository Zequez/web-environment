type PatternConfig = {
  type: 'honeycomb'
  size: number
  rotation: number
  aspectRatio?: number
  x: number // horizontal offset into the source image
  y: number // vertical offset into the source image
}

export async function generatePattern(
  img: HTMLImageElement,
  patternConfig: PatternConfig,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!img.complete) {
      img.onload = () => resolve(makePattern(img, patternConfig))
      img.onerror = reject
    } else {
      resolve(makePattern(img, patternConfig))
    }
  })
}

function makePattern(img: HTMLImageElement, config: PatternConfig): string {
  const aspect = config.aspectRatio ?? 1
  const tileWidth = config.size * aspect
  const tileHeight = config.size

  const { x, y } = config

  // Create offscreen canvas for the pattern tile
  const tileCanvas = document.createElement('canvas')
  tileCanvas.width = tileWidth
  tileCanvas.height = tileHeight
  const tctx = tileCanvas.getContext('2d')!

  // Apply rotation to the tile coordinate system
  if (config.type === 'honeycomb') {
    const triW = tileWidth
    const triH = tileHeight

    // Create wedge from source image
    const wedgeCanvas = document.createElement('canvas')
    wedgeCanvas.width = triW
    wedgeCanvas.height = triH
    const wctx = wedgeCanvas.getContext('2d')!

    // Draw one right triangle from the source
    wctx.save()
    wctx.beginPath()
    wctx.moveTo(0, 0)
    wctx.lineTo(triW, 0)
    wctx.lineTo(0, triH)
    wctx.closePath()
    wctx.clip()
    wctx.drawImage(img, x, y, triW, triH, 0, 0, triW, triH)
    wctx.restore()

    // TileCanvas will hold one rhombus made of two mirrored triangles
    const rhombusCanvas = document.createElement('canvas')
    rhombusCanvas.width = triW
    rhombusCanvas.height = triH
    const rctx = rhombusCanvas.getContext('2d')!

    // Original triangle
    rctx.drawImage(wedgeCanvas, 0, 0)

    // Mirrored triangle to form a rhombus
    rctx.save()
    rctx.translate(triW, 0)
    rctx.scale(-1, 1)
    rctx.drawImage(wedgeCanvas, 0, 0)
    rctx.restore()

    // Now repeat the rhombus in a hexagonal star arrangement (6 around a center)
    const cx = tileWidth / 2
    const cy = tileHeight / 2
    for (let i = 0; i < 6; i++) {
      tctx.save()
      tctx.translate(cx, cy)
      tctx.rotate((i * 60 * Math.PI) / 180)
      tctx.drawImage(rhombusCanvas, -triW / 2, -triH / 2)
      tctx.restore()
    }
  }

  // ---- END PATTERN SECTION ----

  // Build preview canvas with repeated pattern
  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = tileWidth * 4
  finalCanvas.height = tileHeight * 4
  const fctx = finalCanvas.getContext('2d')!
  const pattern = fctx.createPattern(tileCanvas, 'repeat')!
  fctx.fillStyle = pattern
  fctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)

  return finalCanvas.toDataURL()
}
