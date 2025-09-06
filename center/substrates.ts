import type { UserConfig } from 'vite'

import editorGenViteConfig from '@/substrates/editor/vite.config.gen'
import bareGenViteConfig from '@/substrates/bare/vite.config.gen'

export const SUBSTRATES: {
  [key: string]: (repo: string, port?: number) => UserConfig
} = {
  editor: editorGenViteConfig,
  bare: bareGenViteConfig,
}

export const DEFAULT_SUBSTRATE = 'bare'
