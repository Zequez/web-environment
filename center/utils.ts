import path from 'path'
import cx from 'classnames'

export { cx }

export const $path = (p: string) => path.resolve(__dirname, '../', p)

export function maybeReadLS<T>(key: string, defaultValue: T): T {
  try {
    return (JSON.parse(localStorage.getItem(key)!) as T) || defaultValue
  } catch (e) {
    return defaultValue
  }
}

// export function saveToLS(key: string) {

// }

export function debounce<T extends any[]>(fn: (...a: T) => void, ms: number) {
  let t: any
  return (...a: T) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...a), ms)
  }
}

export function timeAgoMini(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) {
    if (seconds < 10) {
      return '<10s'
    } else if (seconds < 30) {
      return '<30s'
    } else if (seconds < 60) {
      return '<1m'
    }
  }
  if (seconds < 60 * 60) return `${Math.floor(seconds / 60)}m`
  if (seconds < 60 * 60 * 24) return `${Math.floor(seconds / 60 / 60)}h`
  return `${Math.floor(seconds / 60 / 60 / 24)}d`
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
