<script lang="ts" module>
  export type Config = {
    type: 'Markdown'
    content: string
  }
</script>

<script lang="ts">
  import { Markdown } from 'svelte-rune-markdown'

  const { config }: { config: Config } = $props()
</script>

<div class="md">
  <Markdown content={config.content} />
</div>
