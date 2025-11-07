<script lang="ts">
  import { onMount } from 'svelte'

  let MAX_DOTS = 3
  let INTERVAL = 500
  let dots = $state(0)
  onMount(() => {
    const interv = setInterval(() => {
      dots = (dots + 1) % MAX_DOTS
    }, INTERVAL)

    return () => clearInterval(interv)
  })
</script>

<span class="w-0">
  {new Array(dots + 1).fill('.').join('')}
</span>
