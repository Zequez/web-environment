import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import { mount, hydrate } from 'svelte'

// @ts-ignore
import App from '@@@/App.svelte'

const rootEl = document.getElementById('root')!
const fun = rootEl.hasChildNodes() ? hydrate : mount
fun(App, { target: document.getElementById('root')!, props: {} })
