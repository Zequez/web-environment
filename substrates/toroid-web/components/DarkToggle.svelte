<script lang="ts">
  import { lsState, onTripleKey } from '@/center/utils/runes.svelte'
  import SunIcon from '~icons/fa6-solid/sun'
  import MoonIcon from '~icons/fa6-solid/moon'

  let darkMode = lsState<{ v: 'dark' | 'light' | 'system' }>('dark', {
    v: 'system',
  })
  const systemDarkMode =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false

  let currentlyDarkMode = $derived.by(() => {
    if (darkMode.v === 'system') {
      return systemDarkMode ? true : false
    } else {
      return darkMode.v === 'dark'
    }
  })

  $effect(() => {
    if (currentlyDarkMode) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  })

  function cycleDarkMode() {
    if (darkMode.v === 'system') {
      darkMode.v = 'light'
    } else if (darkMode.v === 'light') {
      darkMode.v = 'dark'
    } else {
      darkMode.v = 'system'
    }
  }

  onTripleKey('2', null, cycleDarkMode)
</script>

<button
  title="Dark/Light mode"
  onclick={cycleDarkMode}
  class="font-thin text-center flexcc"
>
  <span
    class={[
      'inline-block text-center mr3 w12 text-center',
      {
        'font-black': darkMode.v === 'system',
        'opacity-25': darkMode.v !== 'system',
      },
    ]}>AUTO</span
  >
  <span
    class={[
      'inline-block w6 text-center',
      {
        'font-black': currentlyDarkMode,
        'opacity-25': !currentlyDarkMode,
      },
    ]}><MoonIcon /></span
  ><span
    class={[
      'inline-block w6 text-center',
      {
        'font-black': !currentlyDarkMode,
        'opacity-25': currentlyDarkMode,
      },
    ]}><SunIcon /></span
  >
</button>
