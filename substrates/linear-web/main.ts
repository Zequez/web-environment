import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import { mount, hydrate } from 'svelte'

import Root from './Root.svelte'

const fun = import.meta.env.DEV ? mount : hydrate
fun(Root, { target: document.getElementById('root')!, props: {} })
