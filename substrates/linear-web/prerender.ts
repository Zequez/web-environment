import { render as svelteRender } from 'svelte/server'

import Root from './Root.svelte'

export default function render(_url: string) {
  return svelteRender(Root, {})
}
