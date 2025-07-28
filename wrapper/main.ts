import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import { mount } from 'svelte'

import Editor from './Editor.svelte'
// import Test from './Test.svelte'

mount(Editor, { target: document.getElementById('root')!, props: {} })

console.log('wrapper')
