export function draggable(
  onStart: () => void,
  onDragging: ({ dx, dy }: { dx: number; dy: number }) => void,
  onDone: () => void,
  startThreshold: number = 0,
) {
  let dragging = $state<{
    x: number
    y: number
    didMove: boolean
  } | null>(null)

  function handleDragOnMouseDown(ev: MouseEvent) {
    const clickedEl = ev.currentTarget as HTMLElement
    if (ev.button === 0 && !dragging) {
      ev.stopPropagation()
      ev.preventDefault()
      dragging = { x: 0, y: 0, didMove: false }

      if (startThreshold === 0) {
        onStart()
      }

      function onMouseMove(ev: MouseEvent) {
        const dx = ev.movementX
        const dy = ev.movementY

        dragging = {
          x: dragging!.x + dx,
          y: dragging!.y + dy,
          didMove: dragging!.didMove ? true : startThreshold === 0,
        }

        if (startThreshold !== 0 && !dragging!.didMove) {
          const distance = Math.hypot(dragging.x, dragging.y)
          if (distance > startThreshold) {
            onStart()
            dragging.didMove = true
            onDragging({ dx: dragging.x, dy: dragging.y })
          }
        } else {
          onDragging({ dx, dy })
        }
      }

      function onMouseUp(muEvent: MouseEvent) {
        if (dragging!.didMove) {
          clickedEl.addEventListener('click', cancelNextClick)
          function cancelNextClick(clickEv: MouseEvent) {
            clickEv.stopPropagation()
            clickEv.preventDefault()
            clickedEl.removeEventListener('click', cancelNextClick)
          }
        }

        onDone()
        dragging = null

        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }
  }

  return {
    get dragging() {
      return dragging
    },
    handleDragOnMouseDown,
  }
}

function saveToLS<K>(key: string, val: any) {
  localStorage.setItem(key, JSON.stringify(val))
}

function readFromLS<K>(key: string, def: K) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) {
      saveToLS(key, def)
      return def
    }
    return JSON.parse(raw) as K
  } catch (e) {
    saveToLS(key, def)
    return def
  }
}

export function lsState<K>(
  key: string,
  def: K,
  reset?: boolean | ((v: K) => K),
) {
  if (typeof localStorage === 'undefined') return def
  if (typeof reset === 'boolean') {
    localStorage.removeItem(key)
  }

  let initialState = readFromLS(key, def)

  if (typeof reset === 'function') {
    initialState = reset(initialState)
  }

  let data = $state<K>(initialState)

  $effect(() => {
    saveToLS(key, data)
  })

  return data
}

export const onTripleShift = onTripleKey.bind(null, 'Shift')

export function onTripleKey(
  keyName: string,
  node: {
    addEventListener: typeof HTMLElement.prototype.addEventListener
    removeEventListener: typeof HTMLElement.prototype.removeEventListener
  } | null,
  callback: () => any,
) {
  let keyCount = 0
  let keyTimeout: any = null

  function handleKeydown(ev: KeyboardEvent) {
    if (ev.key === keyName) {
      keyCount++
      if (keyCount >= 3) {
        callback?.()
        keyCount = 0
        clearTimeout(keyTimeout)
      } else {
        clearTimeout(keyTimeout)
        keyTimeout = setTimeout(() => {
          keyCount = 0
        }, 1000)
      }
    }
  }

  if (node === null && typeof window === 'undefined') return

  let nnode = node || window

  nnode.addEventListener('keydown', handleKeydown)

  return {
    destroy() {
      nnode.removeEventListener('keydown', handleKeydown)
      clearTimeout(keyTimeout)
    },
  }
}

export function onresizeobserver(
  el: HTMLElement,
  callback: (entry: ResizeObserverEntry) => void,
) {
  if (typeof callback !== 'function') return

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      callback(entry)
    }
  })

  observer.observe(el)

  return {
    destroy() {
      observer.disconnect()
    },
    update(newCallback: (entry: ResizeObserverEntry) => void) {
      // Re-bind callback on updates
      callback = newCallback
    },
  }
}
