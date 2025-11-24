<script lang="ts">
  import '@/center/doc.css'

  const props: { children: any } = $props()
</script>

<div class="max-w-screen-md mx-auto px6 doc pb12">
  {@render props.children?.()}
</div>
