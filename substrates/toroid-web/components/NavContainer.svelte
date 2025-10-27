<script lang="ts">
  import { type ClassValue } from 'svelte/elements'

  const props: {
    bgClass?: ClassValue
    containerClass?: ClassValue
    bgImage?: string
    children?: any
  } = $props()
</script>

<div
  class={['relative flex-grow text-white print:hidden', props.containerClass]}
>
  <div
    class={['absolute inset-0 z-8', props.bgClass]}
    style={props.bgImage ? `background-image: url(${props.bgImage})` : null}
  ></div>
  <div class="relative z-10">
    {@render props.children?.()}
  </div>
</div>
