<script lang="ts">
  import { onMount, untrack } from 'svelte'

  type EditorState = {
    cursorPos: number
    scrollPos: number
    value: string
    timestamp: number
  }
  let props: { state: EditorState; onUpdate: (newState: EditorState) => void } =
    $props()

  let el: HTMLTextAreaElement
  let value = $state(props.state.value)

  function throttle(ms: number, fn: () => void) {
    let t: any
    return () => {
      clearTimeout(t)
      t = setTimeout(() => fn(), ms)
    }
  }

  const notifyChange = throttle(100, () => {
    props.onUpdate({
      cursorPos: el.selectionStart,
      scrollPos: el.scrollTop,
      value: value,
      timestamp: Date.now(),
    })
  })

  $effect(() => {
    if (props.state.value !== untrack(() => value)) {
      value = props.state.value
    }
  })

  onMount(() => {
    el.selectionStart = props.state.cursorPos
    el.selectionEnd = props.state.cursorPos
    el.scrollTop = props.state.scrollPos
    el.focus()
  })
</script>

<textarea
  bind:this={el}
  onselectionchange={notifyChange}
  onscroll={notifyChange}
  class="w-full h-full bg-gray-900 font-mono text-white px2 py1.5"
  bind:value
  oninput={notifyChange}
></textarea>
