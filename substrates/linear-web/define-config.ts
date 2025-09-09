import CircleIcon from '~icons/fa6-solid/circle'
import type { WebConfig } from './WebConfig'

type PartialWebConfig = Partial<
  Omit<WebConfig, 'colors' | 'nav' | 'header'> & {
    colors: Partial<WebConfig['colors']>
    nav: Partial<WebConfig['nav']>
    header: Partial<WebConfig['header']>
  }
>

const DEFAULT: WebConfig = {
  title: 'Linear Foo',
  colors: {
    main: {
      hue: 100,
      saturation: 50,
    },
    alt: {
      hue: 200,
      saturation: 80,
    },
  },
  css: {
    width: 'max-w-screen-md',
  },
  floatingIcons: {},
  nav: {
    show: true,
    separator: CircleIcon,
    css: {
      separator: '',
    },
  },
  header: {
    bgImg: '',
    titleImg: '',
    title: undefined,
    css: {
      img: 'max-h-300px',
    },
  },
  sections: [
    {
      title: 'First',
      id: 'first',
      showOnNavigation: true,
      separator: null,
      components: [{ type: 'Markdown', content: 'Lorem ipsum dolor sit amet' }],
    },
    {
      title: 'Second',
      id: 'second',
      showOnNavigation: true,
      separator: null,
      components: [],
    },
  ],
  separators: [],
}

export default function defineConfig(
  partialWebConfig: PartialWebConfig,
): WebConfig {
  return {
    ...DEFAULT,
    ...partialWebConfig,
    ...{
      colors: {
        ...DEFAULT.colors,
        ...partialWebConfig.colors,
      },
      floatingIcons: {
        ...DEFAULT.floatingIcons,
        ...partialWebConfig.floatingIcons,
      },
      nav: {
        ...DEFAULT.nav,
        ...partialWebConfig.nav,
      },
      header: {
        ...DEFAULT.header,
        ...partialWebConfig.header,
      },
    },
  }
}
