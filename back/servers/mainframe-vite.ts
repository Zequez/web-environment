import { createServer } from 'vite'
import reposGenViteConfig from '@/substrates/repos/vite.config.gen'

const reposServer = await createServer(reposGenViteConfig())
await reposServer.listen()

console.log('REPOS UI SERVER URL', reposServer.resolvedUrls?.local?.[0])
