import { render as svelteRender } from 'svelte/server'

// @ts-ignore
import App from '@@@/App.svelte'

export default function render(urlPath: string) {
  ;(global as any).pathname = urlPath
  return svelteRender(App, { preRenderingPathname: urlPath })
}
