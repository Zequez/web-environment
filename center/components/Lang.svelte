<script lang="ts">
  import { getLang } from '../enes.svelte'
  const props: { lang: string; children: any } = $props()
</script>

{#if getLang() === props.lang}
  {@render props.children()}
{/if}
