import createConfig from './substrates/linear-web/vite.config.gen.ts'
import { build } from 'vite'
import { $path } from './center/utils/system.ts'
import { type default as prerenderType } from './substrates/linear-web/prerender.ts'

const { default: render } = (await import(
  $path(`prerenderers/casa-experimental/prerender.js`)
)) as { default: typeof prerenderType }
const { head, body } = render('/')

console.log(body)

const buildPrerendererConfig = createConfig({
  repo: 'casa-experimental',
  mode: 'build-prerenderer',
})

await build(buildPrerendererConfig)

console.log('DONE BUILDING PRE RENDERER')

const buildConfig = createConfig({
  repo: 'casa-experimental',
  mode: 'build',
})

await build(buildConfig)

console.log('DONE BUILDING!')
