<script lang="ts">
  import CodeMirror from 'svelte-codemirror-editor'
  import { EditorView } from '@codemirror/view'
  import { EditorSelection } from '@codemirror/state'
  import { svelte } from '@replit/codemirror-lang-svelte'
  import { oneDark } from '@codemirror/theme-one-dark'

  type LocalEditorState = {
    cursorPos: number
    scrollPos: number
    value: string
    timestamp: number
  }

  let props: {
    state: LocalEditorState
    onUpdate: (newState: LocalEditorState) => void
  } = $props()

  let initialValue = $state(props.state.value)
  let view = $state<EditorView>()

  $effect(() => {
    setEditorValue(props.state.value)
  })

  function debounce(ms: number, fn: () => void) {
    let t: any
    return () => {
      clearTimeout(t)
      t = setTimeout(() => fn(), ms)
    }
  }

  const notifyChange = debounce(100, () => {
    if (!view) return

    const cursorPos = view.state.selection.main.head
    const scrollPos = view.scrollDOM.scrollTop
    const value = view.state.doc.toString()

    props.onUpdate({
      cursorPos: cursorPos,
      scrollPos: scrollPos,
      value: value,
      timestamp: Date.now(),
    })
  })

  function handleCodeMirrorReady(cmView: EditorView) {
    view = cmView

    const { cursorPos, scrollPos } = props.state
    if (typeof cursorPos === 'number') {
      view!.dispatch({
        selection: EditorSelection.cursor(cursorPos),
        scrollIntoView: true,
      })
    }

    if (typeof scrollPos === 'number') {
      requestAnimationFrame(() => {
        view!.scrollDOM.scrollTop = scrollPos
      })
    }

    view.scrollDOM.addEventListener('scroll', notifyChange)
    view.focus()
  }

  function setEditorValue(newValue: string) {
    if (!view) return

    const currentValue = view.state.doc.toString()
    if (currentValue === newValue) return

    const cursorPos = view.state.selection.main.head
    const scrollPos = view.scrollDOM.scrollTop

    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: newValue,
      },
    })

    const safePos = Math.min(cursorPos, newValue.length)

    requestAnimationFrame(() => {
      view!.dispatch({
        selection: EditorSelection.cursor(safePos),
        scrollIntoView: false,
      })

      view!.scrollDOM.scrollTop = scrollPos
    })
  }

  const updateListener = EditorView.updateListener.of((v) => {
    if (v.docChanged || v.selectionSet) {
      notifyChange()
    }
  })
</script>

<CodeMirror
  class="w-full min-h-full"
  bind:value={initialValue}
  onready={handleCodeMirrorReady}
  lang={svelte()}
  theme={oneDark}
  extensions={[updateListener]}
  styles={{
    '&': {
      maxWidth: '100%',
      height: '100%',
    },
  }}
/>
