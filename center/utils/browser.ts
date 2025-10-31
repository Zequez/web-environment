import cx from 'classnames'

export { cx }

export function maybeReadLS<T>(key: string, defaultValue: T): T {
  try {
    return (JSON.parse(localStorage.getItem(key)!) as T) || defaultValue
  } catch (e) {
    return defaultValue
  }
}

export function monitorPinchZoom(cb: (zoom: -1 | 1) => void) {
  let startDist = 0

  function getDistance(touches: TouchList) {
    const [a, b] = [touches[0], touches[1]]
    const dx = a.clientX - b.clientX
    const dy = a.clientY - b.clientY
    return Math.hypot(dx, dy)
  }

  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      startDist = getDistance(e.touches)
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault() // blocks scroll, but not always system zoom
      const newDist = getDistance(e.touches)
      const change = Math.abs(newDist - startDist)
      if (change > 30) {
        if (newDist > startDist) {
          cb(-1)
        } else {
          cb(1)
        }
        startDist = newDist
      }
    }
  }

  document.addEventListener('touchstart', handleTouchStart, { passive: false })

  document.addEventListener('touchmove', handleTouchMove, { passive: false })

  return () => {
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchmove', handleTouchMove)
  }
}

export function cssVariables(
  node: HTMLElement,
  variables: { [key: string]: any },
) {
  setCssVariables(node, variables)

  return {
    update(variables: { [key: string]: any }) {
      setCssVariables(node, variables)
    },
  }
}

function setCssVariables(node: HTMLElement, variables: { [key: string]: any }) {
  for (const name in variables) {
    node.style.setProperty(`--${name}`, variables[name])
  }
}

export function getLocationHash() {
  return typeof window === 'undefined' ? '' : window.location.hash
}

export function observeChildren(
  parent: Element,
  callback: (added: Element[], removed: Element[]) => void,
) {
  const observer = new MutationObserver((mutations) => {
    const added: Element[] = []
    const removed: Element[] = []

    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        Array.from(mutation.addedNodes).forEach((node) => {
          if (node instanceof Element && node.parentElement === parent)
            added.push(node)
        })
        Array.from(mutation.removedNodes).forEach((node) => {
          if (node instanceof Element) removed.push(node)
        })
      }
    }

    if (added.length || removed.length) {
      callback(added, removed)
    }
  })

  observer.observe(parent, { childList: true })

  return () => observer.disconnect()
}
