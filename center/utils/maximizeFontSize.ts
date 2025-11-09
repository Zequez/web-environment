export function maximizeFontSize(
  el: HTMLElement,
  config: number | [number, number],
) {
  const parent = el.parentElement!
  if (!parent) return

  let percent = 1
  let verticalRythm = 1.5
  function parseConfig(p: number | [number, number]) {
    ;[percent, verticalRythm] = Array.isArray(p) ? p : [p, 1.5]
  }
  parseConfig(config)

  const parentStyle = window.getComputedStyle(el)
  const parentPadding =
    parseInt(parentStyle.paddingLeft) + parseInt(parentStyle.paddingRight)

  const clone = el.cloneNode(true) as HTMLHeadingElement
  clone.style.opacity = '50%'
  clone.style.position = 'absolute'
  clone.style.top = '0'
  clone.style.left = '0'
  clone.style.pointerEvents = 'none'
  clone.style.whiteSpace = 'nowrap'
  clone.ariaHidden = 'true'

  const overflowWrapper = document.createElement('div')
  overflowWrapper.style.overflow = 'hidden'
  overflowWrapper.style.position = 'absolute'
  overflowWrapper.style.top = '0'
  overflowWrapper.style.left = '0'

  overflowWrapper.style.height = '100px'
  overflowWrapper.style.width = '100px'
  overflowWrapper.style.background = 'red'
  overflowWrapper.appendChild(clone)

  let adjusting = false
  function reAdjust() {
    if (adjusting) return
    parent.appendChild(overflowWrapper)
    adjusting = true
    const parentWidth = (parent.offsetWidth - parentPadding) * percent

    const currentFontSize = window.getComputedStyle(clone).fontSize
    const initialWidth = clone.getBoundingClientRect().width

    const m = currentFontSize.match(/(\d+)(px|em|rem|pt|pc|in|cm|mm|%)$/)
    let fontSize = Number(m?.[1])
    const unit = m?.[2]

    let maxLoops = 100

    if (initialWidth < parentWidth) {
      // Enlarging
      while (
        parentWidth - clone.getBoundingClientRect().width > 0 &&
        maxLoops >= 0
      ) {
        fontSize += 1
        clone.style.fontSize = `${fontSize}${unit}`
      }
      fontSize -= 1
    } else if (initialWidth > parentWidth) {
      // Shrinking
      while (
        clone.getBoundingClientRect().width - parentWidth > 0 &&
        maxLoops >= 0 &&
        fontSize > 1
      ) {
        fontSize -= 1
        clone.style.fontSize = `${fontSize}${unit}`
        maxLoops--
      }
      fontSize += 1
    }

    clone.style.fontSize = `${fontSize}${unit}`

    const height = clone.getBoundingClientRect().height

    const lineHeight = (Math.floor(height / verticalRythm) + 1) * verticalRythm

    el.style.fontSize = clone.style.fontSize
    el.style.lineHeight = `${lineHeight}px`
    overflowWrapper.remove()

    adjusting = false
  }

  const observer = new ResizeObserver(() => {
    // slight debounce to avoid thrashing if layout adjusts rapidly
    requestAnimationFrame(() => reAdjust())
  })

  observer.observe(parent)

  return {
    destroy() {
      observer.disconnect()
    },
    update(newConfig: number | [number, number]) {
      parseConfig(newConfig)
      reAdjust()
    },
  }
}
