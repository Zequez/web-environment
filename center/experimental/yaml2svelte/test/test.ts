import { compile as svelteCompile } from 'svelte/compiler'
import { compile } from '../compile.ts'
import { parse } from 'yaml'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const appModelRaw = readFileSync(
  path.join(__dirname, './resources/AppModel.svelte'),
  'utf-8',
)
const appYamlRaw = readFileSync(
  path.join(__dirname, './resources/App.yaml'),
  'utf-8',
)
const appYaml = parse(appYamlRaw)
const appModel = svelteCompile(appModelRaw, {})

const compiledAppFromYaml = compile(appYaml as any)

console.log(compiledAppFromYaml)

writeFileSync(
  path.join(__dirname, './resources/AppYaml.svelte'),
  compiledAppFromYaml,
)

try {
  const sveltedAppFromYaml = svelteCompile(compiledAppFromYaml, {})

  writeFileSync(
    path.join(__dirname, './resources/AppYaml.js'),
    sveltedAppFromYaml.js.code,
  )

  writeFileSync(
    path.join(__dirname, './resources/AppModel.js'),
    appModel.js.code,
  )

  if (appModel.js.code !== sveltedAppFromYaml.js.code) {
    console.error('TEST FAILED, OUTPUT INCORRECT')
  } else {
    console.log('TEST SUCCESSFUL, OUTPUT AS EXPECTED')
  }
} catch (e) {
  console.error('Error compiling output Svelte file')
  console.error(e)
}

// const changes = diffLines(appYamlSvelte, compiledAppFromYaml)
// for (const part of changes) {
//   const color = part.added ? chalk.green : part.removed ? chalk.red : chalk.gray
//   console.log(color(part.value))
// }
