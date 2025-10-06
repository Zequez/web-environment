<script lang="ts">
  // @ts-ignore
  import config from '@@@/linear-web.config.ts?raw'
</script>

<div class="w-full h-full text-black/60">
  <textarea
    class="w-full h-500px block font-mono text-xs overflow-auto p1"
    value={config}
  ></textarea>
</div>
