import type { Component } from 'svelte'
import { type Config as TeamConfig } from './section-components/Team.svelte'
import { type Config as MarkdownConfig } from './section-components/Markdown.svelte'
import { type Config as FliersConfig } from './section-components/Fliers.svelte'

export type WebConfig = {
  title: string
  colors: {
    main: {
      hue: number
      saturation: number
    }
    alt: {
      hue: number
      saturation: number
    }
  }
  css: {
    width: string
  }
  floatingIcons: {
    whatsapp?: string
  }
  nav: {
    show: boolean
    separator: Component
    css: {
      separator: string
    }
  }
  header: {
    bgImg: string
    titleImg: string
    title?: string | undefined
    css: {
      img: string
    }
  }
  sections: Section[]
  separators: SeparatorConfig[]
}

export type SectionComponent = TeamConfig | MarkdownConfig | FliersConfig

export type SeparatorConfig = {
  id: string
  flip?: boolean
  snapTo: 'prev' | 'next'
  marginInner?: number
  marginOuter?: number
  viewboxShift?: [number, number, number, number]
} | null

type Section = {
  title: string
  components: SectionComponent[]
  id: string
  showOnNavigation: boolean
  separator: {
    id: string
    reverse?: boolean
    dragInOffset?: number
    cavityOffset?: number
    flip?: boolean
    viewboxShift?: [number, number, number, number]
  } | null
}
