<script lang="ts">
  import { cx } from '@/center/utils'
  import mainStore from '../main-store.svelte'

  import Markdown from '../section-components/Markdown.svelte'
  import Team from '../section-components/Team.svelte'
  import Fliers from '../section-components/Fliers.svelte'

  import Separator from '../Separator.svelte'
  import { onMount } from 'svelte'

  const C = mainStore.getContext()

  const DocEl = document.documentElement

  const SCROLL_TARGET_OFFSET = 120

  let position = $state<{ section: number; progress: number } | null>(null)
  let sectionsElements = $state<HTMLDivElement[]>([])
  let sections = $derived<
    { id: string; showOnNav: boolean; el: HTMLDivElement }[]
  >(
    C.config.sections.map((s, i) => ({
      id: s.id,
      showOnNav: s.showOnNavigation,
      el: sectionsElements[i],
    })),
  )
  let sectionsOnNav: boolean[] = []
  function handleWindowScroll() {
    if (DocEl.scrollHeight !== scrollHeight) {
      recalculateSegments()
    }

    let scrollTop = document.documentElement.scrollTop
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      scrollTop -= segment[1]
      if (scrollTop <= 0) {
        if (segment[0]) {
          const progress = 1 - -scrollTop / segment[1]
          C.cmd.setPosition({ section: segment[0], progress })
        } else {
          if (C.position !== null) {
            C.cmd.setPosition(null)
          }
        }
        break
      }
    }

    // console.log(document.documentElement.scrollTop)
  }

  let scrollHeight = 0
  let segments: [id: string | null, height: number][] = []
  function recalculateSegments() {
    console.log('Calculating segments')
    if (!sections.length) return

    segments.push([null, sections[0].el.offsetTop - SCROLL_TARGET_OFFSET])
    for (let section of sections) {
      segments.push([
        section.showOnNav ? section.id : null,
        section.el.offsetHeight,
      ])
    }
    const sum = segments.reduce((all, c) => all + c[1], 0)
    scrollHeight = DocEl.scrollHeight
    segments.push([null, scrollHeight - sum + SCROLL_TARGET_OFFSET])
  }

  onMount(() => {
    recalculateSegments()
  })
</script>

<svelte:window onscroll={handleWindowScroll} />

{#each C.config.sections as section, i (section.title)}
  {@const nextSeparator = C.config.separators[i + 1]}
  <div
    class={cx('relative b-red', {})}
    bind:this={sectionsElements[i]}
    data-on-nav={section.showOnNavigation}
  >
    {#if C.config.separators[i] && C.config.separators[i].snapTo === 'prev'}
      <Separator index={i} config={C.config.separators[i]} />
    {/if}
    <div
      class={cx('absolute inset-0 z-9', {
        'bg-main-400': i % 2 === 1,
        'bg-main-500': i % 2 === 0,
      })}
    ></div>
    <div
      class={cx(
        'h40px py8 flexcs  b-green relative z-13',
        'text-white font-serif tracking-wider font-thin text-3xl sm:text-4xl md:text-5xl uppercase',
        'text-shadow-[0_2px_0_#0005]',
      )}
    >
      <div class={cx(C.config.css.width, 'mx-auto w-full px4 text-center ')}>
        <div
          id={section.id}
          class="h-0 w-0 relative targetted"
          style={`top: -${SCROLL_TARGET_OFFSET}px;`}
        ></div>
        <div class="rounded-lg b-2 b-transparent">{section.title}</div>
      </div>
    </div>
    <div class={cx(C.config.css.width, 'relative mx-auto py4 px4 z-13')}>
      {#each section.components as compConfig, i (i)}
        {#if compConfig.type === 'Markdown'}
          <Markdown config={compConfig} />
        {:else if compConfig.type === 'Team'}
          <Team config={compConfig} />
        {:else if compConfig.type === 'Fliers'}
          <Fliers config={compConfig} />
        {:else if typeof compConfig.type !== 'string'}
          {@const Comp = compConfig.type}
          <Comp config={compConfig} />
        {/if}
      {/each}
    </div>

    {#if nextSeparator && nextSeparator.snapTo === 'next'}
      <Separator index={i + 1} config={nextSeparator} />
    {/if}
  </div>
{/each}

{#if C.config.separators.length > C.config.sections.length}
  {@const lastSeparator = C.config.separators[C.config.sections.length]}
  {#if lastSeparator && lastSeparator!.snapTo === 'prev'}
    <div class="relative bg-main-100 text-main-500">
      <Separator index={C.config.sections.length} config={lastSeparator!} />
      <div
        class="absolute inset-0 z-8 bg-[url(./noise20.png)] opacity-50"
      ></div>
      <div class="h-20"></div>
    </div>
  {/if}
{/if}

<style>
  .targetted:target + div {
    animation: 2.5s flashSection;
  }

  @keyframes flashSection {
    0% {
      @apply bg-alt-600/0 b-white/0;
    }
    30% {
      @apply bg-alt-600 b-white/50;
    }
    45% {
      @apply bg-alt-600 b-white/50;
    }
    100% {
      @apply bg-alt-600/0 b-white/0;
    }
  }
</style>
