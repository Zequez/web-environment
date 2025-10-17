import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import { mount, hydrate } from 'svelte'

if (import.meta.env.SSR) {
  import('@/center/ssr-mock')
}

// @ts-ignore
import App from '@@@/App.svelte'

const rootEl = document.getElementById('root')!
const fun = rootEl.hasChildNodes() ? hydrate : mount
fun(App, { target: document.getElementById('root')!, props: {} })
