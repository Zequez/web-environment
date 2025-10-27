<script lang="ts">
  import { onMount } from 'svelte'

  const props: { onEnterView: () => void; onLeaveView: () => void } = $props()

  let el: HTMLDivElement

  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        props.onEnterView()
      } else {
        props.onLeaveView()
      }
    })
    observer.observe(el)

    return () => {
      props.onLeaveView()
      observer.disconnect()
    }
  })
</script>

<div
  bind:this={el}
  class="h-24 rounded-1 w-full b-3 b-dashed b-white/50 bg-white/20 opacity-0"
>
</div>
