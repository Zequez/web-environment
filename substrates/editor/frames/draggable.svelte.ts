import canvasStore from '@/center/canvas/canvas-store.svelte'

export default function draggable(
  onStart: () => void,
  onDragging: ({ dx, dy }: { dx: number; dy: number }) => void,
  onDone: () => void,
) {
  const CS = canvasStore.getContext()

  let dragging = $state<{
    x: number
    y: number
    didMove: boolean
  } | null>(null)

  function handleDragOnMouseDown(ev: MouseEvent) {
    const clickedEl = ev.currentTarget as HTMLElement
    console.log('STarting')
    if (ev.button === 0 && !dragging) {
      ev.stopPropagation()
      ev.preventDefault()
      dragging = { x: 0, y: 0, didMove: false }

      onStart()

      function onMouseMove(ev: MouseEvent) {
        const dx = ev.movementX / CS.zoom
        const dy = ev.movementY / CS.zoom

        dragging = {
          x: dragging!.x + dx,
          y: dragging!.y + dy,
          didMove: true,
        }

        onDragging({ dx, dy })
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
