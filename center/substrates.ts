import type { UserConfig } from 'vite'

import type { ViteMetaConfig } from '@/mainframe/servers/vite-spinner/meta-config'

import nonlinearWeb from '@/substrates/nonlinear-web/vite.config.gen'
import linearWeb from '@/substrates/linear-web/vite.config.gen'
import nothingWeb from '@/substrates/nothing-web/vite.config.gen'

export const SUBSTRATES: {
  [key: string]: (metaConfig: ViteMetaConfig) => UserConfig
} = {
  'nonlinear-web': nonlinearWeb,
  'linear-web': linearWeb,
  'nothing-web': nothingWeb,
}

export const DEFAULT_SUBSTRATE = 'nothingWeb'
