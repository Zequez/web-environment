<script lang="ts">
  const P: {
    children: any
    disabled?: boolean
    color?: 'lime' | 'sky' | 'yellow'
    expand?: boolean
    onclick?: () => void
  } = $props()

  let color = $derived(
    {
      lime: 'bg-lime-500 shadow-lime-700',
      sky: 'bg-sky-500 shadow-sky-700 ',
      yellow: 'bg-yellow-500 shadow-yellow-700 ',
    }[P.color || 'lime'],
  )
</script>

<button
  disabled={P.disabled}
  onclick={P.onclick}
  class={[
    color,
    'h6 -translate-y-1.5px flexcc px2 rounded-1 shadow-[0_1px_0_0.5px]',
    'text-3 font-mono text-white uppercase text-shadow-[0_1px_0_#0004] ',
    'hover:brightness-110',
    'disabled:(saturate-0 hover:brightness-100 opacity-50)',
    'active:(translate-y-0px shadow-[0_0.5px_0_0]) ',
    {
      'w-full': P.expand,
    },
  ]}
>
  {#if P.children}
    {@render P.children?.()}
  {/if}
</button>
