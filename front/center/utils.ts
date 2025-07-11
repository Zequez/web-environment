import cx from 'classnames'

export { cx }

export function maybeReadLS<T>(key: string, defaultValue: T): T {
  try {
    return (JSON.parse(localStorage.getItem(key)!) as T) || defaultValue
  } catch (e) {
    return defaultValue
  }
}

// export function saveToLS(key: string) {

// }
