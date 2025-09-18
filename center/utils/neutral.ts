export function debounce<T extends any[]>(fn: (...a: T) => void, ms: number) {
  let t: any
  return (...a: T) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...a), ms)
  }
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
