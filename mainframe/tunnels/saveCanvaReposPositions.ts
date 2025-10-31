// @tunneled
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'

const FILE_PATH = './mainframe/tunnels/reposPos.json'

export default async function saveCanvasRepoPositions(repos: {
  [key: string]: { x: number; y: number }
}) {
  let data: Record<string, { x: number; y: number }> = {}

  // Create file if it doesn't exist
  if (!existsSync(FILE_PATH)) {
    await writeFile(FILE_PATH, '{}', 'utf8')
  }

  // Read and parse existing JSON
  try {
    const content = await readFile(FILE_PATH, 'utf8')
    data = content ? JSON.parse(content) : {}
  } catch (err) {
    console.warn('Failed to parse reposPos.json, recreating file.', err)
    data = {}
  }

  // Update entry
  data = { ...data, ...repos }

  console.log('WRITING FILE!', data)
  // Write back to file, pretty formatted
  await writeFile(FILE_PATH, JSON.stringify(data, null, 2), 'utf8')

  return null
}
