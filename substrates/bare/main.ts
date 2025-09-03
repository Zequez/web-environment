import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import { mount } from 'svelte'

// @ts-ignore
import Index from '@@@/app.svelte'

mount(Index, { target: document.getElementById('root')!, props: {} })
