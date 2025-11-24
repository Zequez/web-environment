import transformerVariantGroup from '@unocss/transformer-variant-group'
import presetIcons from '@unocss/preset-icons'
import {
  defineConfig,
  presetTypography,
  presetWind4,
  transformerDirectives,
} from 'unocss'

import presetWebFonts from '@unocss/preset-web-fonts'
import { createLocalFontProcessor } from '@unocss/preset-web-fonts/local'

const FLEX_ALIGNS: Record<string, string> = {
  c: 'center',
  e: 'flex-end',
  s: 'flex-start',
  _: 'stretch',
}

type WenvUnoCSSConfig = {
  repo: string
  fonts?: {
    sans?: string
    serif?: string
    mono?: string
  }
}

const DEFAULT_FONTS = {
  sans: 'Arimo:400,700',
  serif: 'Andada Pro:400,700',
  mono: 'Fira Code:400,700',
}

export default function generateUnoCSSConfig(config: WenvUnoCSSConfig) {
  const resolvedFonts = { ...DEFAULT_FONTS, ...(config.fonts || {}) }
  // console.log('Generating UNOCSS', resolvedFonts)
  return defineConfig({
    configFile: false,
    content: {
      pipeline: {
        include: [
          // the default
          /\.(svelte|[jt]sx|mdx|html|ts)($|\?)/,
          // include js/ts files
          'repos/**/*.{js,ts}',
        ],

        // exclude files
        // exclude: []
      },
    },
    presets: [
      presetIcons(),
      presetWind4(),
      presetTypography(),
      presetWebFonts({
        provider: 'bunny', // default provider
        fonts: resolvedFonts,

        processors: createLocalFontProcessor({
          // Directory to cache the fonts
          cacheDir: `node_modules/.cache/unocss/fonts/${config.repo}`,

          // Directory to save the fonts assets
          fontAssetsDir: './assets/fonts',

          fontServeBaseUrl: '/fonts',
        }),
      }),
    ],
    transformers: [transformerVariantGroup(), transformerDirectives()],
    rules: [
      [
        /^flex([cse_])([cse_])$/,
        ([, c1, c2]) => ({
          display: 'flex',
          'align-items': FLEX_ALIGNS[c1],
          'justify-content': FLEX_ALIGNS[c2],
        }),
      ],
    ],
    variants: [
      (matcher) => {
        if (!matcher.startsWith('hocus:')) return matcher

        return {
          // slice `hover:` prefix and passed to the next variants and rules
          matcher: matcher.slice(6),
          selector: (s) => `${s}:hover, ${s}:focus`,
        }
      },
      (matcher) => {
        const variant = 'placeholder-shown'
        if (!matcher.includes(variant)) return matcher
        const isNot = matcher.startsWith('not-')
        return {
          // slice `hover:` prefix and passed to the next variants and rules
          matcher: isNot
            ? matcher.slice(variant.length + 5)
            : matcher.slice(variant.length + 1),
          selector: (input) =>
            isNot
              ? `${input}:not(:placeholder-shown)`
              : `${input}:placeholder-shown`,
        }
      },
    ],
    extendTheme: (theme) => {
      return {
        ...theme,
        breakpoints: {
          xs: '360px',
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1536px',
        },
        colors: {
          ...theme.colors,
          potato: 'red',
          main: (() => {
            let colors: [string, string][] = []
            for (let i = 10; i <= 90; i += 10) {
              colors.push([
                `${i}0`,
                `hsl(var(--main-hue) var(--main-saturation) ${i}%)`,
              ])
            }
            colors.push([
              `950`,
              `hsl(var(--main-hue) var(--main-saturation) 95%)`,
            ])
            return Object.fromEntries(colors)
          })(),

          alt: (() => {
            let colors: [string, string][] = []
            for (let i = 10; i <= 90; i += 10) {
              colors.push([
                `${i}0`,
                `hsl(var(--alt-hue) var(--alt-saturation) ${i}%)`,
              ])
            }
            colors.push([`50`, `hsl(var(--alt-hue) var(--alt-saturation) 5%)`])
            colors.push([
              `950`,
              `hsl(var(--alt-hue) var(--alt-saturation) 95%)`,
            ])
            return Object.fromEntries(colors)
          })(),
        },
      }
    },
  })
}
