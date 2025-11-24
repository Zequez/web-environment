type Cloud = {
  circles: (ctx: CanvasRenderingContext2D, x: number, y: number) => void
  x: number
  y: number
  speed: number
}

type Config = {
  clouds: number
  cloudColor: string
  cloudSpeed: number
}

export default function generate(
  canvas: {
    ctx: CanvasRenderingContext2D
    w: number
    h: number
  },
  config: Config,
) {
  let { ctx, w, h } = canvas

  let clouds: Cloud[] = []

  function make() {
    function makeCircleRoutine(n: number) {
      let NRandomCloudShapedPoints: [number, number, number][] = []

      // ChatGPT: Generate the random points
      // We'll make n random circles around (0,0) in an irregular cluster
      for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * 50
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius * 0.2 // flatter vertically
        const r = 15 + Math.random() * 18 // circle radius
        NRandomCloudShapedPoints.push([x, y, r])
      }

      return (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        // ChatGPT: Render the NRandomCloudShapedPoints as circles CLOUD_COLOR
        ctx.fillStyle = config.cloudColor
        for (const [dx, dy, r] of NRandomCloudShapedPoints) {
          ctx.beginPath()
          ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    clouds = []
    for (let i = 0; i < config.clouds; ++i) {
      // ChatGPT: add random clouds with the makeCircleRoutine
      const x = Math.random() * w
      const y = Math.random() * h * 0.4 // keep clouds near the upper sky
      const circles = makeCircleRoutine(6 + Math.floor(Math.random() * 8))
      const speed = config.cloudSpeed * (0.5 + Math.random())
      clouds.push({ circles, x, y, speed })
    }
  }

  function animate(time: number) {
    ctx.clearRect(0, 0, w, h)
    for (const cloud of clouds) {
      cloud.x += cloud.speed
      if (cloud.x - 100 > w) cloud.x = -100 // loop around
      cloud.circles(ctx, cloud.x, cloud.y)
    }
  }

  return { make, animate }
}
