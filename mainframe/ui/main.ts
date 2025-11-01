import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import 'svooltip/styles.css'
import { mount } from 'svelte'

import Compositor from './components/Compositor.svelte'
// import App from './components/App.svelte'

mount(Compositor, { target: document.getElementById('root')!, props: {} })
// mount(App, { target: document.getElementById('root')!, props: {} })

// const content = (window as any).api.readFile('./.gitignore')
// console.log('FILE!', content)
