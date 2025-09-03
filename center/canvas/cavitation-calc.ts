export type ActualElement = {
  el: HTMLElement

  left: number
  right: number
  top: number
  bottom: number

  x: number
  y: number
  w: number
  h: number

  id: string
  title: string
  layer: string
}

export function gatherElements(container: HTMLElement) {
  return Array.from(container.children)
    .map((c) => {
      const h = c as HTMLElement
      // console.log(
      //   (h.firstChild! as HTMLElement).id,
      //   h.offsetTop,
      //   h.offsetHeight,
      //   h.offsetLeft,
      //   h.offsetWidth,
      // )
      const id = h.getAttribute('data-id')
      if (!id) return null
      const layer = h.getAttribute('data-layer')
      const title = h.getAttribute('data-title')
      const left = h.offsetLeft - h.offsetWidth / 2
      const right = h.offsetLeft + h.offsetWidth / 2
      const top = h.offsetTop
      const bottom = h.offsetTop + h.offsetHeight

      return {
        el: h,

        left,
        right,
        top,
        bottom,

        x: left,
        y: top,
        w: h.offsetWidth,
        h: h.offsetHeight,

        id,
        layer,
        title,
      }
    })
    .filter((e) => e) as ActualElement[]
}

export function getCavitationSizeAndOrigin(elements: ActualElement[]): {
  size: { w: number; h: number }
  origin: { x: number; y: number }
} {
  if (elements.length === 0) {
    return {
      size: { w: window.innerWidth, h: window.innerHeight },
      origin: { x: -window.innerWidth / 2, y: -window.innerHeight / 2 },
    }
  }

  const leftMost = Math.min(...elements.map((r) => r.left))
  const rightMost = Math.max(...elements.map((r) => r.right))
  const topMost = Math.min(...elements.map((r) => r.top))
  const bottomMost = Math.max(...elements.map((r) => r.bottom))

  const w = rightMost - leftMost
  const h = bottomMost - topMost

  const cavitationW = Math.max(w, window.innerWidth)
  const cavitationH = Math.max(h, window.innerHeight)

  return {
    size: { w: cavitationW, h: cavitationH },
    origin: { x: -leftMost, y: -topMost },
  }
}
