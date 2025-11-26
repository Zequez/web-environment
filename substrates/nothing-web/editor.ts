import '@unocss/reset/tailwind-v4.css'
import 'virtual:uno.css'
import { mount } from 'svelte'

// @ts-ignore
// import App from '@@@/App.svelte'

import EditorWrapper from './EditorWrapper.svelte'

const rootEl = document.getElementById('root')!

mount(EditorWrapper, { target: rootEl, props: {} })
