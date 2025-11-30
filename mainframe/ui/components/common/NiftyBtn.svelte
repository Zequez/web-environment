<script lang="ts">
  import type { ClassValue } from 'svelte/elements'

  const P: {
    children: any
    disabled?: boolean
    color?: 'lime' | 'sky' | 'yellow' | 'red' | 'gray'
    expand?: boolean
    onclick?: () => void
    'aria-label'?: string
    title?: string
    class?: ClassValue
  } = $props()

  let color = $derived(
    {
      lime: 'bg-lime-500 shadow-lime-700',
      sky: 'bg-sky-500 shadow-sky-700 ',
      yellow: 'bg-yellow-500 shadow-yellow-700 ',
      red: 'bg-red-500 shadow-red-700 ',
      gray: 'bg-gray-500 shadow-gray-700 ',
    }[P.color || 'lime'],
  )
</script>

<button
  aria-label={P['aria-label']}
  title={P['title']}
  disabled={P.disabled}
  onclick={P.onclick}
  class={[
    P.class,
    color,
    'h6 -translate-y-1.5px flexcc px2 rounded-1 shadow-[0_1px_0_0.5px]',
    'text-3 font-mono text-white uppercase text-shadow-[0_1px_0_#0004] ',
    'hover:brightness-110 cursor-pointer',
    'disabled:(saturate-0 hover:brightness-100 opacity-50)',
    {
      'w-full': P.expand,
      'active:(translate-y-0px shadow-[0_0.5px_0_0])': !P.disabled,
    },
  ]}
>
  {#if P.children}
    {@render P.children?.()}
  {/if}
</button>
