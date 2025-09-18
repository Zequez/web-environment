<script lang="ts">
  // import '@/substrates/editor/markdown.css'
  import './markdown.css'
  import { cssVariables, cx } from '@/center/utils'
  import { type WebConfig } from './WebConfig'

  import mainStore from './main-store.svelte'
  import Nav from './layout-components/Nav.svelte'
  import Header from './layout-components/Header.svelte'
  import FloatingButtons from './layout-components/FloatingButtons.svelte'
  import Sections from './layout-components/Sections.svelte'

  const { config }: { config: WebConfig } = $props()

  const C = mainStore.initContext(config)
</script>

<svelte:head>
  <title>{config.title}</title>
  <meta
    name="theme-color"
    content={`hsl(var(--main-hue) var(--main-saturation) 50%)`}
  />
</svelte:head>

<svelte:body
  use:cssVariables={{
    'main-hue': config.colors.main.hue,
    'main-saturation': config.colors.main.saturation,
    'alt-hue': config.colors.alt.hue,
    'alt-saturation': config.colors.alt.saturation,
  }}
/>

<div
  class="w-full h-full bg-main-500"
  style={`background-image: url(./noise20.png);`}
>
  <Nav />
  <Header />
  <FloatingButtons />
  <Sections />

  <!-- <ConfigurableSeparator
    class="w-full -mt-30px relative z-100 text-main-900 "
    h={60}
    shape={{ type: 'chevron', height: 30 }}
  /> -->
</div>

<style>
  :global {
    .no-separator .separator {
      display: none !important;
    }
  }
</style>
