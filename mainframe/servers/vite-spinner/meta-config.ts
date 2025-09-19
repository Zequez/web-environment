export type ViteMetaConfig =
  | {
      repo: string
      port: number
      accessibleFromLocalNetwork: boolean
      mode: 'run'
    }
  | { repo: string; mode: 'build' }
  | { repo: string; mode: 'build-prerenderer' }
