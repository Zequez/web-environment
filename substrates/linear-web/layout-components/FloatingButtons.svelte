<script lang="ts">
  import { cx } from '@/center/utils'
  import mainStore from '../main-store.svelte'
  import WhatsappIcon from '~icons/fa6-brands/whatsapp'

  const C = mainStore.getContext()
</script>

{#if C.config.floatingIcons.whatsapp}
  <a
    href={`https://wa.me/${C.config.floatingIcons.whatsapp}`}
    class={`
        fixed right-2 bottom-14 z-999
        md:bottom-2 rounded-md h10 w10
        flexcc
        bg-green-500 hover:brightness-115 text-white text-2xl
      `}
  >
    <WhatsappIcon />
  </a>
{/if}
