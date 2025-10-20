<script module lang="ts">
  import { onMount, type Component } from 'svelte'
  import { globImportToRecord } from '@/center/utils/neutral'
  import { onresizeobserver } from '@/center/utils/runes.svelte'
  import { default as favicon } from './favicon.jpg'
  import { default as noise } from './noise.png'
  import { default as guarda } from './guarda'
  import { default as VerticalRhythmLines } from './components/VerticalRhythmLines.svelte'
  import { default as PagesList } from './components/PagesList.svelte'
  if (import.meta.hot) {
    let scrollY = 0
    let scrollX = 0

    // before the module is replaced, capture scroll
    import.meta.hot.dispose(() => {
      scrollX = window.scrollX
      scrollY = window.scrollY
      sessionStorage.setItem(
        '__hmr_scroll',
        JSON.stringify({ x: scrollX, y: scrollY }),
      )
    })

    // after the new module is accepted, restore scroll
    import.meta.hot.accept(() => {
      const raw = sessionStorage.getItem('__hmr_scroll')
      if (raw) {
        const { x, y } = JSON.parse(raw)
        requestAnimationFrame(() => {
          window.scrollTo(x, y)
        })
      }
    })
  }
</script>

<script lang="ts">
  type Page = {
    Component: Component
    metadata: { title: string }
  }

  console.log('Tick 2t4')

  // WORKAROUND FOR A BUG I HAVENT FIGURED OUT YET
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const preRenderingPathname =
    typeof global !== 'undefined' ? (global as any).pathname : null
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  onMount(() => {})

  let container: HTMLDivElement

  // PAGES NAVIGATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const props: { preRenderingPathname?: string } = $props()

  const rawPages = import.meta.glob('./pages/*.(svx|svelte)', {
    eager: true,
  }) as { [key: string]: { default: Component; metadata: { title: string } } }

  const pages = globImportToRecord(
    './pages/',
    (v) => ({ Component: v.default, metadata: v.metadata }),
    rawPages,
  )
  function syntheticNavigateTo(navPath: string) {
    console.log('Synthetic nav')

    const currentState = history.state || {}
    history.replaceState(
      { ...currentState, scrollTop: document.documentElement.scrollTop },
      '',
      window.location.pathname,
    )
    history.pushState({ path: navPath, scrollTop: 0 }, '', navPath)

    currentPath = navPath
    document.documentElement.scrollTop = 0
    recalculatePagesListHeight()
  }

  onMount(() => {
    window.addEventListener('popstate', (event) => {
      const path = event.state?.path || window.location.pathname
      const scrollTop = event.state?.scrollTop ?? 0

      currentPath = path
      recalculatePagesListHeight()
      document.documentElement.scrollTop = scrollTop
      // optionally restore scrollTop or do other state updates
    })
  })

  let currentPath = $state(
    preRenderingPathname
      ? preRenderingPathname
      : typeof window !== 'undefined'
        ? window.location.pathname.length > 1
          ? window.location.pathname.replace(/\/$/, '')
          : window.location.pathname
        : '/',
  )

  const navPathToPageName = $derived(generateNavigationPaths())
  const navPathToPage = $derived.by(() => {
    const o: { [key: string]: Page } = {}
    for (let path in navPathToPageName) {
      o[path] = pages[navPathToPageName[path]]
    }
    return o
  })
  const pageNameToNavPath = $derived.by(() => {
    const o: { [key: string]: string } = {}
    for (let path in navPathToPageName) {
      o[navPathToPageName[path]] = path
    }
    return o
  })

  const currentPageName = $derived.by(() => {
    const page = navPathToPageName[currentPath]
    if (page) return page
    else return '404'
  })
  const currentPage = $derived(pages[currentPageName])

  function generateNavigationPaths(): { [key: string]: string } {
    let paths: { [key: string]: string } = {}
    for (let pageName in pages) {
      if (pageName === '404') continue
      if (pageName === 'index') {
        paths['/'] = pageName
      } else {
        paths[`/${pageName}`] = pageName
      }
    }
    return paths
  }

  function intersectLinkClicks(ev: MouseEvent) {
    if (ev.target instanceof HTMLAnchorElement) {
      const url = new URL(ev.target.href)
      if (url.host === window.location.host) {
        if (url.pathname === currentPath) return
        syntheticNavigateTo(url.pathname)
        ev.preventDefault()
        ev.stopPropagation()
      }
    }
  }

  // PAGES LIST HEIGHT CALCULATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  let pagesListHeight = $state(0)

  // $effect(() => {
  //   if (import.meta.env.SSR) return
  //   CurrentPageComponent
  //   recalculatePagesListHeight()
  // })

  function recalculatePagesListHeight() {
    const contentHeight = container.clientHeight
    const bodyHeight = document.body.clientHeight

    if (contentHeight < bodyHeight) {
      pagesListHeight = bodyHeight - contentHeight + 48
    } else {
      pagesListHeight = 48
    }
  }
</script>

<svelte:head
  ><link rel="icon" type="image/jpg" href={favicon} />
  <title>{currentPage.metadata?.title || 'Untitled'}</title></svelte:head
>
<svelte:window
  onclick={intersectLinkClicks}
  onresize={recalculatePagesListHeight}
/>
<div class="flex flex-col min-h-screen relative"
  ><div
    class="bg-gray-100 text-gray-950 dark:(bg-gray-950! text-gray-100!"
    bind:this={container}
    use:onresizeobserver={recalculatePagesListHeight}
    ><currentPage.Component></currentPage.Component></div
  >
  <div id="nav-start"></div>
  <div class="[object Object]"
    ><span
      class="absolute inset-0 pointer-events-none b-t-1 b-b-1 b-black/20 dark:b-white/50"
    ></span>
    <a
      href="#nav-start"
      onclick={(ev) => {
        const el = document.getElementById('nav-start')!
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        ev.preventDefault()
      }}
      class="font-serif relative"
      ><div
        class="absolute top-10% right-100% mr1 h-80% opacity-20 dark:filter-invert"
        ><undefined></undefined></div
      >
      Ezequiel Adrián Schwartzman
      <div
        class="absolute top-10% left-100% ml1 h-80% scale-x-[-1] opacity-20 dark:filter-invert"
        ><img
          src={guarda}
          class="h-full max-w-none"
          alt="Intricate design on right of name"
        /></div
      ></a
    ></div
  >
  <div
    class="relative flex-grow bg-gray-950 text-white"
    style={`background-image: url(${noise});`}
    >{#if typeof window !== undefined}
      <PagesList {pages} currentPage={currentPageName} {pageNameToNavPath}
      ></PagesList>
    {/if}
    <VerticalRhythmLines></VerticalRhythmLines></div
  ></div
>
