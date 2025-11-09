<script lang="ts">
  import { onMount } from 'svelte'
  import type { ClassValue } from 'svelte/elements'

  let {
    value = $bindable(),
    ...P
  }: {
    value: string
    autofocus?: boolean
    onConfirm?: () => void
    onCancel?: () => void
    placeholder?: string
    disabled?: boolean
    class?: ClassValue
  } = $props()

  let el: HTMLInputElement
  onMount(() => {
    if (P.autofocus) {
      console.log('FOCUS')
      el.focus()
    }
  })
</script>

<input
  bind:this={el}
  bind:value
  disabled={P.disabled}
  onkeydown={(ev) => {
    if (ev.key === 'Enter') {
      P.onConfirm?.()
    } else if (ev.key === 'Escape') {
      P.onCancel?.()
    }
  }}
  class={[
    P.class,
    'rounded-1 h6 text-3 text-black px2 shadow-[inset_0_0_0_2px] shadow-black/20 outline-none flex-grow min-w-0 font-mono focus:shadow-lime-500',
  ]}
  placeholder={P.placeholder}
/>
