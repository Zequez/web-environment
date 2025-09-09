import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import { mount } from 'svelte'

import Root from './Root.svelte'

mount(Root, { target: document.getElementById('root')!, props: {} })
