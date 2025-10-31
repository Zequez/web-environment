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
      // Assumes the containing element of the PIN has -translate-x-1/2
      // In the future the PIN center position may be configurated
      // Or we can just try to read the transform property from the DOM
      // Or read getBoundingClientRect instead
      // ...the point is, there is no neccesity right now so I'll just write
      // this note so that these lines of code make sense.
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

export function getCavitationSizeAndOrigin(
  elements: ActualElement[],
  padding: number = 0,
): {
  size: { w: number; h: number }
  origin: { x: number; y: number }
} {
  const p = padding
  const p2 = padding * 2
  if (elements.length === 0) {
    return {
      size: { w: window.innerWidth + p2, h: window.innerHeight + p2 },
      origin: { x: -window.innerWidth / 2 - p, y: -window.innerHeight / 2 - p },
    }
  }

  // else if (elements.length === 1) {
  //   return {
  //     size: { w: window.innerWidth + p2, h: window.innerHeight + p2 },
  //     origin: { x: window.innerWidth / 2 + p, y: window.innerHeight / 2 + p },
  //   }
  // }

  console.log(elements)

  let winEl = {
    left: -window.innerWidth / 2,
    right: window.innerWidth / 2,
    top: -window.innerHeight / 2,
    bottom: window.innerHeight / 2,
  }

  const leftMost = Math.min(...elements.map((r) => r.left), winEl.left)
  const rightMost = Math.max(...elements.map((r) => r.right), winEl.right)
  const topMost = Math.min(...elements.map((r) => r.top), winEl.top)
  const bottomMost = Math.max(...elements.map((r) => r.bottom), winEl.bottom)

  console.log('LRTB most', leftMost, rightMost, topMost, bottomMost)

  const w = rightMost - leftMost
  const h = bottomMost - topMost

  console.log('Height, width', w, h)

  const cavitationW = w + p2
  const cavitationH = h + p2

  return {
    size: { w: cavitationW, h: cavitationH },
    origin: { x: -leftMost + p, y: -topMost + p },
  }
}
