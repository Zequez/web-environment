import { createServer } from 'vite'
import viteConfig from '../vite.config'

export async function startVite() {
  // const viteConfig = await generateConfig({ landRoot: '', build: false })
  const server = await createServer(viteConfig)
  await server.listen()
  console.log(`🚀 Dev server running at ${server.resolvedUrls?.local?.[0]}`)
  // return await Bun.$`FORCE_COLOR=1 bun run vite dev --port ${VITE_PORT}`
}
