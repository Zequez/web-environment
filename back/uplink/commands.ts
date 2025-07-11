import {
  readdir,
  readFile as fsReadFile,
  stat,
  rename as fsRename,
  mkdir,
  rm as fsRemove,
} from 'fs/promises'
import { join } from 'path'
import dirTree from 'directory-tree'

const LAND_ROOT = 'land'

async function ping<T>(msg?: T): Promise<['pong', T | undefined]> {
  return ['pong', msg]
}

export async function filesList(directory: string) {
  const files = await readdir(join(directory))
  return files
}

export type UplinkFile =
  | {
      type: 'binary'
      encoding: 'base64'
      mimeType: string
      data: string
    }
  | {
      type: 'text'
      data: string
    }
  | {
      type: 'directory'
      data: string[]
    }

async function readFile(fileName: string): Promise<UplinkFile> {
  const filePath = join('.', fileName)
  const stats = await stat(filePath)
  if (stats.isDirectory()) {
    const files = await readdir(filePath)
    return {
      type: 'directory',
      data: files,
    }
  } else {
    const file = await Bun.file(filePath)

    // Check if it's a binary file based on extension (you can improve this)
    const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf']
    const isBinary = binaryExtensions.some((ext) => filePath.endsWith(ext))

    if (isBinary) {
      // Read file as binary and encode as Base64
      const buffer = await fsReadFile(filePath)
      const base64 = buffer.toString('base64')

      return {
        type: 'binary',
        encoding: 'base64',
        mimeType: file.type, // Auto-detect MIME type (if Bun.file supports it)
        data: base64,
      }
    } else {
      return {
        type: 'text',
        data: await file.text(),
      }
    }
  }
}

async function writeFile(fileName: string, content: UplinkFile) {
  const filePath = join('.', fileName)
  if (content.type === 'text') {
    await Bun.write(filePath, content.data)
  }
  return true
}

const exists = async (p: string) =>
  stat(p)
    .then(() => true)
    .catch((e) => e.code !== 'ENOENT' && Promise.reject(e))

async function renameFrameComponent(name: string, newName: string) {
  // Build absolute/relative paths once.
  const oldSvelte = join(LAND_ROOT, `${name}.svelte`)
  const newSvelte = join(LAND_ROOT, `${newName}.svelte`)
  const oldMeta = join(LAND_ROOT, `${name}.meta.json`)
  const newMeta = join(LAND_ROOT, `${newName}.meta.json`)
  const oldFolder = join(LAND_ROOT, name)
  const newFolder = join(LAND_ROOT, newName)

  if (
    (await exists(newSvelte)) ||
    (await exists(newMeta)) ||
    (await exists(newFolder))
  ) {
    throw new Error(`A frame called “${newName}” already exists.`)
  }

  // ── 2. Rename both artefacts (this will throw if originals missing) ─
  if (await exists(oldSvelte)) {
    await fsRename(oldSvelte, newSvelte)
  }
  if (await exists(oldMeta)) {
    await fsRename(oldMeta, newMeta)
  }
  if (await exists(oldFolder)) {
    await fsRename(oldFolder, newFolder)
  }

  return true // keeps the command API consistent with writeFile()
}

async function createFrameComponent(
  name: string,
  meta: string,
  component: string,
) {
  const sveltePath = join(LAND_ROOT, `${name}.svelte`)
  const metaPath = join(LAND_ROOT, `${name}.meta.json`)

  // 1. Ensure frames/ exists.
  await mkdir(LAND_ROOT, { recursive: true })

  // 2. Guard: abort if either target file already exists.
  const exists = async (p: string) =>
    stat(p)
      .then(() => true)
      .catch((e) => e.code !== 'ENOENT' && Promise.reject(e))

  if ((await exists(sveltePath)) || (await exists(metaPath))) {
    throw new Error(`A frame called “${name}” already exists.`)
  }

  // 3. Write both files.
  await Bun.write(sveltePath, component)
  await Bun.write(metaPath, meta.endsWith('\n') ? meta : `${meta}\n`)

  return true
}

async function removeFrameComponent(name: string) {
  const sveltePath = join(LAND_ROOT, `${name}.svelte`)
  const metaPath = join(LAND_ROOT, `${name}.meta.json`)
  const folderPath = join(LAND_ROOT, name)

  if (await exists(sveltePath)) await fsRemove(sveltePath)
  if (await exists(metaPath)) await fsRemove(metaPath)
  if (await exists(folderPath)) await fsRemove(folderPath, { recursive: true })

  return true
}

async function checkGit(landName: string) {
  // const landPath = join(LAND_ROOT, landName)
  // const gitPath = join(landPath, '.git')
  // return await exists(gitPath)
}

async function initGit(landName: string) {
  const landPath = join(LAND_ROOT, landName)
  await Bun.$`cd ${landPath} && git init`
  // return true
}

async function pushGit(landName: string) {
  // const landPath = join(LAND_ROOT, landName)
  // await Bun.$`cd ${landPath} && git add . && git commit -m "Built ${new Date().toISOString()}" && git push`
  return true
}

async function buildWeb(landName: string) {
  // const landPath = join(LAND_ROOT, landName)
  // await Bun.$`cd ${landPath} && npx rollup -c`
  return true
}

async function pushGitWeb(landName: string) {}

async function tree() {
  const tree = dirTree(LAND_ROOT, {
    // ignore .git
    exclude: /\.git/,
  })
  return tree
}

export const cmds = {
  ping,
  filesList,
  readFile,
  writeFile,
  renameFrameComponent,
  createFrameComponent,
  removeFrameComponent,

  checkGit,
  initGit,
  pushGit,
  buildWeb,
  pushGitWeb,

  tree,
}

export type UplinkCmd =
  | ['ping', ...Parameters<typeof ping>]
  | ['filesList', ...Parameters<typeof filesList>]
  | ['readFile', ...Parameters<typeof readFile>]
  | ['writeFile', ...Parameters<typeof writeFile>]
  | ['renameFrameComponent', ...Parameters<typeof renameFrameComponent>]
  | ['createFrameComponent', ...Parameters<typeof createFrameComponent>]
  | ['removeFrameComponent', ...Parameters<typeof removeFrameComponent>]
  | ['checkGit', ...Parameters<typeof checkGit>]
  | ['initGit', ...Parameters<typeof initGit>]
  | ['tree']

export type UplinkReturn<T extends UplinkCmd> = T extends [
  infer K extends keyof typeof cmds,
  ...infer Args,
]
  ? Awaited<ReturnType<(typeof cmds)[K]>>
  : never

export async function run(cmd: UplinkCmd) {
  // @ts-ignore
  return await cmds[cmd[0]](...cmd.slice(1))
}
