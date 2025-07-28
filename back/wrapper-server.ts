import { createServer } from 'vite'
import viteConfig from '../wrapper/vite.wrapper.config'

export async function startWrapper() {
  const server = await createServer(viteConfig)
  await server.listen()
  console.log(`🚀 Wrapper server running at ${server.resolvedUrls?.local?.[0]}`)
  // return await Bun.$`FORCE_COLOR=1 bun run vite dev --port ${VITE_PORT}`
}
