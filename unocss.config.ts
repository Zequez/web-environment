import transformerVariantGroup from '@unocss/transformer-variant-group'
import {
  defineConfig,
  presetTypography,
  presetWind3,
  transformerDirectives,
} from 'unocss'
import presetWebFonts from '@unocss/preset-web-fonts'

const FLEX_ALIGNS: Record<string, string> = {
  c: 'center',
  e: 'flex-end',
  s: 'flex-start',
  _: 'stretch',
}

export default defineConfig({
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
    presetWind3(),
    presetTypography(),
    // presetWebFonts({
    //   provider: 'bunny', // default provider
    //   // fonts: {
    //   //   sans: 'Alegreya Sans SC',
    //   //   mono: 'Fira Code',
    //   //   serif: 'Alegreya SC', // Example of a serif font
    //   // },
    // }),
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
  theme: {
    fontFamily: {
      sans: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)',
      serif: 'var(--font-serif, Georgia, Cambria, "Times New Roman", serif)',
      mono: 'var(--font-mono, SFMono-Regular, Menlo, Monaco, Consolas, monospace)',
    },
    boxShadow: {
      solid: '0 1.5px 0 1px var(--un-shadow-color)',
    },
    breakpoints: {
      xs: '360px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    colors: {
      main: (() => {
        let colors: [string, string][] = []
        for (let i = 10; i <= 90; i += 10) {
          colors.push([
            `${i}0`,
            `hsl(var(--main-hue), var(--main-saturation), ${i}%)`,
          ])
        }
        colors.push([
          `950`,
          `hsl(var(--main-hue), var(--main-saturation), 95%)`,
        ])
        return Object.fromEntries(colors)
      })(),

      alt: (() => {
        let colors: [string, string][] = []
        for (let i = 10; i <= 90; i += 10) {
          colors.push([
            `${i}0`,
            `hsl(var(--alt-hue), var(--alt-saturation), ${i}%)`,
          ])
        }
        colors.push([`50`, `hsl(var(--alt-hue), var(--alt-saturation), 5%)`])
        colors.push([`950`, `hsl(var(--alt-hue), var(--alt-saturation), 95%)`])
        return Object.fromEntries(colors)
      })(),
    },
  },
})
