<script lang="ts" module>
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
  import { onMount, type Component } from 'svelte'
  import { globImportToRecord } from '@/center/utils/neutral'
  import { onresizeobserver } from '@/center/utils/runes.svelte'

  import VerticalRhythmLines from '@/center/components/VerticalRhythmLines.svelte'
  import PagesList from './PagesList.svelte'
  import Guarda from './Guarda.svelte'
  import DefaultContainer from './Container.svelte'
  import DefaultNavContainer from './NavContainer.svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  // import Editor from './Editor.svelte'

  const props: {
    title: string
    nav: string[][]
    favicon: string
    navBg: string
    Guarda: Component
    Container?: Component
    NavContainer?: Component
  } = $props()

  type Page = {
    Component: Component
    metadata: { title: string }
  }

  console.log('Somethin g to pages gstststtslob sts')

  // WORKAROUND FOR A BUG I HAVENT FIGURED OUT YET
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const preRenderingPathname =
    typeof global !== 'undefined' ? (global as any).pathname : null
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  onMount(() => {})

  let container: HTMLDivElement

  // PAGES NAVIGATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const rawPages = import.meta.glob('@@@/pages/*.svelte', {
    eager: true,
  }) as { [key: string]: { default: Component; metadata: { title: string } } }

  const pages = globImportToRecord(
    `../../repos/${__REPO__}/pages/`,
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

  function recalculatePagesListHeight() {
    const contentHeight = container.clientHeight
    const bodyHeight = document.body.clientHeight

    if (contentHeight < bodyHeight) {
      pagesListHeight = bodyHeight - contentHeight + 48
    } else {
      pagesListHeight = 48
    }
  }

  const Container = $derived(props.Container || DefaultContainer)
  const NavContainer = $derived(props.NavContainer || DefaultNavContainer)
</script>

<svelte:head>
  <link rel="icon" type="image/jpg" href={props.favicon} />
  <title>{currentPage.metadata?.title || props.title}</title>
</svelte:head>

<svelte:window
  onclick={intersectLinkClicks}
  onresize={recalculatePagesListHeight}
/>

<!-- {#if import.meta.env.DEV}
  <Editor />
{/if} -->

<div class="flex flex-col min-h-screen relative">
  <div bind:this={container} use:onresizeobserver={recalculatePagesListHeight}>
    <Container>
      <currentPage.Component />
    </Container>
  </div>
  {#if props.Guarda}
    <props.Guarda />
  {:else}
    <Guarda image={''} title={props.title} />
  {/if}

  <NavContainer>
    {#if !import.meta.env.SSR}
      <PagesList
        {pages}
        currentPage={currentPageName}
        {pageNameToNavPath}
        nav={props.nav}
        {Container}
      />
    {/if}
  </NavContainer>

  <VerticalRhythmLines />
</div>
