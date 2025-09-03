import chalk from 'chalk'
import createContextedStore, { proxifyCmd } from '../contexted-store'
import { onMount } from 'svelte'

const defaultZoomLevels = new Array(5).fill(1).map((_, i) => 1 * 0.75 ** i)

export const STANDARD_FRAME_WIDTH = 360

function generateZoomLevels(
  minZoom: number,
  maxZoom: number,
  amount: number = 6,
) {
  const r = Math.pow(minZoom / maxZoom, 1 / (amount - 1))
  const zoomLevels = Array.from({ length: amount }, (_, i) => maxZoom * r ** i)
  return zoomLevels
}

function calculateMaxZoom() {
  return Math.min(1, window.innerWidth / STANDARD_FRAME_WIDTH)
}

export default createContextedStore('canvas', () => {
  let focus = $state<null | string>(null)
  let zoomLevels = $state(generateZoomLevels(0.3, calculateMaxZoom()))
  let zoom = $state(defaultZoomLevels[0])
  let cavitationSize = $state({ w: 0, h: 0 })
  let originPosition = $state({ x: 0, y: 0 })
  // let minZoom = $state(defaultZoomLevels[defaultZoomLevels.length - 1])
  // let maxZoom = $state(zoomLevels[0])
  let birdsEye = $state(false)
  let edgeScrollMode = $state(false)
  let edgeScrollDirection = $state<number | null>(null) // -PI to + PI
  let showMinimap = $state<boolean>(false)

  type VP = {
    x: number
    y: number
    z: number
  }
  let vp = $state<VP>({ x: 0, y: 0, z: 1 })
  let targetVp = $state<VP>({ x: 0, y: 0, z: 1 })

  let scrollContainer: HTMLElement = null!
  let cavitationContainer: HTMLElement = null!
  let originContainer: HTMLElement = null!
  onMount(() => {
    setInterval(edgeScrollTick, 10)
  })

  const EDGE_SCROLL_SPEED = 10
  function edgeScrollTick() {
    if (edgeScrollDirection !== null) {
      const dx = Math.cos(edgeScrollDirection) * EDGE_SCROLL_SPEED
      const dy = Math.sin(edgeScrollDirection) * EDGE_SCROLL_SPEED

      scrollContainer.scrollBy(dx, dy)
    }
  }

  function containerTransformCenterToScreenPos() {
    const scrollX = scrollContainer.scrollLeft
    const scrollY = scrollContainer.scrollTop
    const contW = scrollContainer.scrollWidth
    const contH = scrollContainer.scrollHeight
    const originX = contW / 2 - scrollX
    const originY = contH / 2 - scrollY
    return { originX, originY }
  }

  const cmd = {
    toggleEdgeScrollMode() {
      edgeScrollMode = !edgeScrollMode
      if (!edgeScrollMode) {
        edgeScrollDirection = null
      }
    },
    informEdgeScroll(direction: number | null) {
      edgeScrollDirection = direction
    },
    focus(target: string | null) {
      focus = target
    },
    setCavitationSize(
      scrollEl: HTMLDivElement,
      cavitationEl: HTMLDivElement,
      originEl: HTMLDivElement,
      newSize: { w: number; h: number },
      newOrigin: { x: number; y: number },
    ) {
      scrollContainer = scrollEl
      cavitationContainer = cavitationEl
      originContainer = originEl

      cavitationSize = newSize
      originPosition = newOrigin
      const newMinZoom = window.innerWidth / cavitationSize.w

      zoomLevels = generateZoomLevels(newMinZoom, calculateMaxZoom())
      // Set zoom to the closest
      const closest = zoomLevels
        .map((z, i) => [i, Math.abs(z - zoom)])
        .sort((a, b) => a[1] - b[1])[0][0]
      zoom = zoomLevels[closest]

      optimizedCavitationSetter()
    },
    shiftZoom(zoomShift: number, clientX?: number, clientY?: number) {
      const resolvedClientX = clientX ?? window.innerWidth / 2
      const resolvedClientY = clientY ?? window.innerHeight / 2
      const zoomIndex = zoomLevels.indexOf(zoom)
      const newZoomIndex = zoomIndex + zoomShift
      if (newZoomIndex >= 0 && newZoomIndex < zoomLevels.length) {
        const newZoom = zoomLevels[newZoomIndex]
        const zoomDelta = 1 - newZoom / zoom

        // If zoom delta > 0 = zooming out, shrinks
        // If zoom delta < 0 = zooming in, enlarges

        const { originX, originY } = containerTransformCenterToScreenPos()

        // If cursor is at the right of originX, scroll left
        // If cursor is at the left of originX, scroll right
        const dx = resolvedClientX - originX
        const dy = resolvedClientY - originY

        const dx2 = cavitationSize.w * zoom - cavitationSize.w * newZoom
        const dy2 = cavitationSize.h * zoom - cavitationSize.h * newZoom
        zoom = newZoom

        // console.log(cavitationSize.w, dx, dx2)

        optimizedCavitationSetter()
        if (zoomDelta < 0) {
          scrollContainer.scrollBy(
            -dx * zoomDelta - dx2 / 2,
            -dy * zoomDelta - dy2 / 2,
          )
        } else {
          scrollContainer.scrollBy(
            -dx * zoomDelta - dx2 / 2,
            -dy * zoomDelta - dy2 / 2,
          )
        }
        return true
      } else {
        return false
      }
    },
    goTo(location: Partial<{ x: number; y: number; z: number }>) {
      targetVp = { ...targetVp, ...location }
    },
    toggleMinimap() {
      showMinimap = !showMinimap
    },
  }

  function optimizedCavitationSetter() {
    cavitationContainer.style.width = `${cavitationSize.w * zoom}px`
    cavitationContainer.style.height = `${cavitationSize.h * zoom}px`

    originContainer.style.left = `${originPosition.x * zoom}px`
    originContainer.style.top = `${originPosition.y * zoom}px`
    originContainer.style.transform = `scale(${zoom})`
  }

  const cmdProxy = proxifyCmd(chalk.yellow('[CMD]'), cmd)

  return {
    cmd: cmdProxy,
    get vp() {
      return vp
    },
    get zoom() {
      return zoom
    },
    getZoom() {
      return zoom
    },
    get focus() {
      return focus
    },
    get edgeScrollMode() {
      return edgeScrollMode
    },
    get edgeScrollDirection() {
      return edgeScrollDirection
    },
    get birdsEye() {
      return birdsEye
    },
    get cavitationSize() {
      return cavitationSize
    },
    get originPosition() {
      return originPosition
    },
    get showMinimap() {
      return showMinimap
    },
  }
})
