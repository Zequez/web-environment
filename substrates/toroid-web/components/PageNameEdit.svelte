<script lang="ts">
  import { onMount } from 'svelte'
  import CheckIcon from '~icons/fa6-solid/check'
  import CancelIcon from '~icons/fa6-solid/xmark'

  const props: {
    initialValue: string
    unavailableValues: string[]
    onConfirm: (newValue: string) => void
    onCancel: () => void
  } = $props()

  let value = $state(props.initialValue)

  const validChars = /[a-z0-9\-]/

  let tainted = $state(false)

  const isValid = $derived(
    !props.unavailableValues.includes(value) &&
      value.length > 0 &&
      validChars.test(value),
  )
  const visualIsValid = $derived(!tainted || isValid)
  let el = $state<HTMLInputElement | null>(null)
  onMount(() => {
    el!.focus()
  })

  function maybeConfirm() {
    if (isValid) {
      props.onConfirm(value)
    }
  }
</script>

<div class="flex space-x-0.5 text-white mt0.5">
  <input
    onkeydown={(ev) => {
      tainted = true
      if (ev.key === 'Enter') {
        maybeConfirm()
      } else if (ev.key === 'Escape') {
        props.onCancel()
      }
    }}
    bind:this={el}
    bind:value
    placeholder="Page name"
    class={[
      ' font-mono block w-full rounded-1 lh-6 text-black px-1.5',

      {
        'outline-red-500 shadow-[inset_0_0_0_1px_#7005] bg-red-50':
          !visualIsValid,
        'outline-main-500 shadow-[inset_0_0_0_1px_#0005] bg-main-50':
          visualIsValid,
      },
    ]}
  />
  <button
    onclick={maybeConfirm}
    class="bg-emerald-400 w-6 flex-shrink-0 rounded-1 flexcc hover:brightness-110 cursor-pointer shadow-[inset_0_0_0_1px_#0003]"
    ><CheckIcon /></button
  >
  <button
    onclick={() => props.onCancel()}
    class="bg-red-400 w-6 flex-shrink-0 rounded-1 flexcc hover:brightness-110 cursor-pointer shadow-[inset_0_0_0_1px_#0003]"
    ><CancelIcon /></button
  >
</div>
