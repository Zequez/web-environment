<script lang="ts" module>
  if (import.meta.hot) {
    let scrollY = 0
    let scrollX = 0

    // before the module is replaced, capture scroll
    import.meta.hot.dispose(() => {
      const el = document.getElementById('edit-scroll-container')
      if (el) {
        console.log('Ending, editor element found')
        let elScrollX = el.scrollLeft
        let elScrollY = el.scrollTop
        sessionStorage.setItem(
          '__hmr_scroll_editor',
          JSON.stringify({ x: elScrollX, y: elScrollY }),
        )
      }
      scrollX = window.scrollX
      scrollY = window.scrollY
      sessionStorage.setItem(
        '__hmr_scroll',
        JSON.stringify({ x: scrollX, y: scrollY }),
      )
    })

    // after the new module is accepted, restore scroll
    import.meta.hot.accept((a) => {
      const raw = sessionStorage.getItem('__hmr_scroll')
      if (raw) {
        const { x, y } = JSON.parse(raw)
        requestAnimationFrame(() => {
          window.scrollTo(x, y)
        })
      }
      const el = document.getElementById('edit-scroll-container')
      if (el) {
        console.log('Restoring, editor element found')
        const raw = sessionStorage.getItem('__hmr_scroll_editor')
        if (raw) {
          const { x, y } = JSON.parse(raw)

          requestAnimationFrame(() => {
            let el = document.getElementById('edit-scroll-container')
            if (el) {
              el.scrollTop = y
              el.scrollLeft = x
            }
          })
        }
      }
    })
  }

  export type PagesUpdate = {
    nav: string[][]
    deleted: string[]
    renamed: { [key: string]: string }
    created: string[]
  }
</script>

<script lang="ts">
  import { onMount, type Component, type Snippet } from 'svelte'
  import { globImportToRecord } from '@/center/utils/neutral'
  import {
    lsState,
    onresizeobserver,
    onTripleKey,
  } from '@/center/utils/runes.svelte'

  import PenIcon from '~icons/fa6-solid/pen'
  import VerticalRhythmLines from '@/center/components/VerticalRhythmLines.svelte'
  import PagesList from './PagesList.svelte'
  import DefaultGuarda from './Guarda.svelte'
  import DefaultPageWrapper from './DefaultPageWrapper.svelte'
  import DefaultNavContainer from './NavContainer.svelte'
  import DefaultIcon from '@/assets/favicon.png'
  import DefaultNavBg from '@/assets/noise20.png'
  import { cssVariables } from '@/center/utils'
  import type Editor from './Editor.svelte'
  import Kanban from '@/center/components/Kanban/Kanban.svelte'
  import EditBtn from './EditBtn.svelte'
  import PagesListEditor from './PagesListEditor.svelte'
  import { tunnel } from '@/center/tunnel'

  const props: {
    title: string
    nav: string[][]
    favicon?: string
    socialIcon?: string
    navBg?: string
    Guarda?: Component
    Container?: Component
    NavContainer?: Component
    NavContainerBg?: Snippet
    PageWrapper?: Component
    RailingBar?: Snippet
    themeColors?: {
      'main-hue': number
      'main-saturation': number
      'alt-hue'?: number
      'alt-saturation'?: number
    }
  } = $props()

  type Page = {
    Component: Component
    metadata: Metadata
  }

  type Metadata = {
    title?: string
    description?: string
    noNav?: boolean
  }

  function cleanNav() {
    let nav = [...props.nav]

    let toRemove: string[] = []
    for (let nav of props.nav) {
      for (let page of nav) {
        if (!pages[page]) {
          toRemove.push(page)
          console.warn(`Page ${page} not found`)
        }
      }
    }

    nav = nav.map((nav) => nav.filter((p) => !toRemove.includes(p)))

    return nav
  }

  // Check if all pages exist

  console.log('aaaaaaaaa')

  // WORKAROUND FOR A BUG I HAVENT FIGURED OUT YET
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const preRenderingPathname =
    typeof global !== 'undefined' ? (global as any).pathname : null
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  onMount(() => {})

  let themeColors = {
    'main-hue': 205,
    'main-saturation': 70,
    'alt-hue': 300,
    'alt-saturation': 70,
    ...(props.themeColors || {}),
  }

  let container: HTMLDivElement

  // PAGES NAVIGATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const rawPages = import.meta.glob('@@@/pages/*.svelte', {
    eager: true,
  }) as { [key: string]: { default: Component; metadata: Metadata } }

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

  let nav = $state(cleanNav())

  onMount(() => {
    window.addEventListener('popstate', (event) => {
      const path = event.state?.path || window.location.pathname
      const scrollTop = event.state?.scrollTop ?? 0

      currentPath = path
      recalculatePagesListHeight()
      document.documentElement.scrollTop = scrollTop
      // optionally restore scrollTop or do other state updates
    })

    return () => {
      // console.log('APP IS UNMOUNTING')
    }
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

  const Container = $derived(props.Container || DefaultPageWrapper)
  const NavContainer = $derived(props.NavContainer || DefaultNavContainer)

  let editing = lsState<{ v: 'page' | 'nav' | null }>('editing', { v: null })

  function toggleEditMode(target: 'page' | 'nav' | null) {
    if (!import.meta.env.DEV) return

    if (editing.v === 'nav') {
      onDonePagesUpdate()
    }

    if (editing.v === target) {
      editing.v = null
    } else {
      editing.v = target
    }
  }

  let EditorComp = $state<typeof Editor>()

  $effect(() => {
    if (editing.v === 'page') {
      console.log('Importing editor')
      import('./Editor.svelte').then((mod) => {
        EditorComp = mod.default
      })
    }
  })

  const ResolvedPageWrapper = $derived(props.PageWrapper || DefaultPageWrapper)

  let pagesListEditor = $state<undefined | PagesListEditor>(undefined)
  function onDonePagesUpdate() {
    const pagesUpdate = pagesListEditor!.getUpdate()
    console.log('Updating nav', pagesUpdate)
    tunnel('substrates/toroid-web/tunnel.ts/setAppNav', {
      updates: pagesUpdate,
      repo: __REPO__,
    }).then((success) => {
      console.log('Saving nav success?', success)
    })
  }
</script>

<svelte:head>
  <link rel="icon" type="image/jpg" href={props.favicon || DefaultIcon} />
  <title>{currentPage.metadata?.title || props.title}</title>
  {#if currentPage.metadata?.description}
    <meta name="description" content={currentPage.metadata?.description} />
  {/if}
  {#if props.socialIcon}
    <meta property="og:image" content={props.socialIcon} />
  {/if}
</svelte:head>

<svelte:window
  onclick={intersectLinkClicks}
  onresize={recalculatePagesListHeight}
/>

<div use:cssVariables={themeColors}>
  {#if import.meta.env.DEV}
    <div class="bottom-1 right-1 fixed z-1000 flex flex-col space-y-1">
      {#if editing.v !== null}
        <EditBtn
          opened={true}
          text="page"
          onclick={() => toggleEditMode(null)}
        />
      {:else}
        <EditBtn
          opened={editing.v === 'page'}
          text="page"
          onclick={() => toggleEditMode('page')}
        />
        <EditBtn
          opened={editing.v === 'nav'}
          text="Nav"
          onclick={() => toggleEditMode('nav')}
        />
      {/if}
    </div>

    {#if editing.v === 'page' && EditorComp}
      <div class="flex fixed inset-0 z-999 bg-white">
        <div class="w-1/2 b-r-2 b-gray-600">
          <EditorComp pageName={currentPageName} />
        </div>
        <div class="w-1/2 overflow-y-auto" id="edit-scroll-container">
          <ResolvedPageWrapper>
            <currentPage.Component />
          </ResolvedPageWrapper>
        </div>
      </div>
    {:else if editing.v === 'nav'}
      <PagesListEditor
        bind:this={pagesListEditor}
        {nav}
        allPages={Object.keys(pages)}
      />
    {/if}
  {/if}
</div>

<div
  class={[
    'flex flex-col min-h-screen relative',
    {
      'hidden!': editing.v === 'page',
    },
  ]}
  use:cssVariables={themeColors}
>
  <div bind:this={container} use:onresizeobserver={recalculatePagesListHeight}>
    <ResolvedPageWrapper>
      <currentPage.Component />
    </ResolvedPageWrapper>
  </div>
  <DefaultGuarda title={props.title} Content={props.RailingBar} />

  {#if !currentPage.metadata?.noNav}
    <div class="relative print:hidden flex-grow">
      {#if props.NavContainerBg}
        <div class="absolute inset-0 z-9">
          {@render props.NavContainerBg()}
        </div>
      {/if}
      <div class="relative z-10">
        {#if !import.meta.env.SSR}
          <PagesList
            {pages}
            currentPage={currentPageName}
            {pageNameToNavPath}
            nav={props.nav}
            PageWrapper={ResolvedPageWrapper}
          />
        {/if}
      </div>
    </div>
  {/if}

  <VerticalRhythmLines />
</div>
