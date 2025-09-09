<script lang="ts">
  import { cx } from '@/center/utils'
  import mainStore from '../main-store.svelte'
  import { onMount } from 'svelte'

  const C = mainStore.getContext()

  let stickyNav = $state<boolean>(false)

  let navBarShrinkTarget: HTMLDivElement = $state(null!)
  let navBarBaseClass = $derived([
    'h-full overflow-hidden bg-black/15 px2 shadow-[inset_0_1px_0_0_#fff3,inset_0_-1px_0_0_#0003] bg-[url(./noise20.png)]',
    {
      'backdrop-blur-sm': !C.optimizeVisuals,
    },
  ])
  const navBarShrinkStrategies = [
    'flexcc tracking-wider space-x-4 md:rounded-lg rounded-t-lg',
    'flexcc tracking-wider space-x-4 w-full',
    'flexcc tracking-wider space-x-4 w-full no-separator',
    'flexcc tracking-wider space-x-1px w-full no-separator',
    'flexcc tracking-wider space-x-1px w-full no-separator text-sm',
    'flexcc tracking-tight space-x-1px w-full no-separator text-sm',
    'flexcs tracking-tight space-x-1px w-full no-separator text-sm overflow-x-auto!',
  ]

  let firstRender = true
  let prevScreenWidth = window.innerWidth
  function handleWidthChange() {
    const newScreenWidth = window.innerWidth

    if (prevScreenWidth === newScreenWidth && !firstRender) return
    firstRender = false

    for (let klass of navBarShrinkStrategies) {
      navBarShrinkTarget.setAttribute('class', cx(...navBarBaseClass, klass))
      const w = navBarShrinkTarget.offsetWidth
      const scrollW = navBarShrinkTarget.scrollWidth

      if (scrollW <= w) {
        break
      }
    }

    prevScreenWidth = newScreenWidth
  }

  onMount(() => {
    setTimeout(() => {
      handleWidthChange()
    })
  })

  let SeparatorIcon = $derived(C.config.nav.separator)
</script>

<svelte:window
  onscroll={(ev) => {
    if (stickyNav && window.scrollY === 0) {
      stickyNav = false
    } else if (!stickyNav && window.scrollY > 0) {
      stickyNav = true
    }
  }}
  onresize={() => {
    handleWidthChange()
  }}
/>

{#if C.config.nav.show}
  <div
    class={cx(
      'fixed z-100 h12 left-0 w-full',
      'transition-[background-color,box-shadow] transition-duration-500',
      'text-white font-serif text-shadow-[0_1px_0_#0006]',
      'bottom-0 md:top-2',
    )}
  >
    <div class="h-full flexcc">
      <!-- <div class="h-full rounded-t-lg px2 bg-red-500"> -->
      <div
        class={cx(...navBarBaseClass, navBarShrinkStrategies[0])}
        bind:this={navBarShrinkTarget}
      >
        {#each C.config.sections as section, i (section.title)}
          <a
            href="#{section.id}"
            class="uppercase font-bold h-full group flexcc relative z-10"
          >
            <span
              class={[
                'px2 py1 rounded-lg absolute z-10',
                'group-hover:(bg-white/20 transition-duration-0) transition-colors transition-duration-500',
                {
                  'bg-alt-500! text-main-900 shadow-[0_1px_0_0.5px] shadow-black/40':
                    C.activeSection === section.id,
                },
              ]}
            >
              {section.title}
            </span>
            <span class="px2 py1 relative z-12">{section.title}</span>
            {#if C.position?.section === section.id}
              <span
                class="h-full block absolute left-0 w1 -translate-x-1/2 bg-black/25 z-11"
                style={`left: ${C.position.progress * 100}%;`}
              ></span>
            {/if}
          </a>
          {#if i < C.config.sections.length - 1}
            <SeparatorIcon
              class={cx(
                'separator text-[9px] flex-shrink-0 relative z-10 text-main-950 block [group-no-separator]:hidden',
                C.config.nav.css.separator,
              )}
            />
          {/if}
        {/each}
      </div>
    </div>
    <!-- </div> -->
  </div>
{/if}
