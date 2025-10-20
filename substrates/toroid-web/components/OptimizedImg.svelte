<script lang="ts">
  import { getContext } from 'svelte'

  const props: {
    src: [string, string, string]
    meta: { height: number; width: number }
    alt: string
    title?: string
    class?: any
    style?: string
  } = $props()

  const sizes = [100, 250, 500]
  function toSrcSet(arr: [string, string, string]) {
    return arr.map((src, i) => `${src} ${sizes[i]}w`).join(', ')
  }

  const isPreviewMode = getContext('preview-page-mode')
</script>

<img
  style={props.style}
  srcset={isPreviewMode ? props.src[0] : toSrcSet(props.src)}
  width={props.meta.width}
  height={props.meta.height}
  class={[props.class ? props.class : 'block']}
  alt={props.alt}
  title={props.title}
/>
