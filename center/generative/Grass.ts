type Grass = {
  height: number
  thickness: number
  x: number
  color: string
  phase: number
  speed: number
}

type Config = {}

export default function generate(
  canvas: {
    ctx: CanvasRenderingContext2D
    w: number
    h: number
  },
  config: Config,
) {
  let { ctx, w, h } = canvas

  // let C = {thickness: 0.5, height: 5, speed: 0.002, ...config}}

  let grass: Grass[] = []

  function make() {
    grass = []
    const bladeCount = Math.floor(w / 4) // one every few pixels
    for (let i = 0; i < bladeCount; i++) {
      const height = 5 + Math.random() * 20
      const thickness = 0.5 + Math.random() * 2
      const x = i * 4 + Math.random() * 2
      const color = `hsl(${100 + Math.random() * 30}, 60%, ${30 + Math.random() * 20}%)`
      const phase = Math.random() * Math.PI * 2
      const speed = 0.002 + Math.random() * 0.003 // radians per frame
      grass.push({ height, thickness, x, color, phase, speed })
    }
  }

  function animate(time: number) {
    ctx.clearRect(0, 0, w, h)
    for (const blade of grass) {
      const yBase = h
      const sway = Math.sin(time * blade.speed + blade.phase) * 3 // sway amplitude
      const tipX = blade.x + sway
      const tipY = yBase - blade.height

      // compute perpendicular offset for base width
      const baseWidth = blade.thickness
      const dx = tipX - blade.x
      const dy = tipY - yBase
      const len = Math.sqrt(dx * dx + dy * dy)
      const nx = (dy / len) * baseWidth // perpendicular unit vector * width
      const ny = (-dx / len) * baseWidth

      ctx.fillStyle = blade.color
      ctx.beginPath()
      // left base corner
      ctx.moveTo(blade.x - nx, yBase - ny)
      // right base corner
      ctx.lineTo(blade.x + nx, yBase + ny)
      // tip of the blade
      ctx.lineTo(tipX, tipY)
      ctx.closePath()
      ctx.fill()
    }
  }

  return { make, animate }
}
