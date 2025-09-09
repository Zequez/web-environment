import type { MDXContent } from 'mdx/types'
import { getContext, setContext } from 'svelte'
import type api from '../lib/api.svelte'
import createContextedStore, { proxifyCmd } from '@/center/contexted-store'
import chalk from 'chalk'

export type Frontmatter = {
  x?: number
  y?: number
  title?: string
  layer?: 'fg' | 'bg'
  draft?: boolean
  z?: number
  hidden?: boolean
  tunnels?: Tunnels
}

export type Tunnels = {
  [K in DoorwayPosition]?: string
}

export type FullFrontmatter = {
  x: number
  y: number
  title: string
  layer: 'fg' | 'bg'
  draft: boolean
  z: number
  hidden: boolean
  tunnels: Tunnels
}

export type Frame = {
  id: string
  fm: Frontmatter
  component: MDXContent
}

export type DoorwayPosition =
  | 'nn'
  | 'ne'
  | 'ee'
  | 'se'
  | 'ss'
  | 'sw'
  | 'ww'
  | 'nw'

export default createContextedStore('frames', () => {
  const allFramesRaw = import.meta.glob('@@@/frames/*.mdx', {
    eager: true,
  })

  let rawFramesById = Object.fromEntries(
    Object.entries(allFramesRaw).map(([key, value]) => {
      const fm = { ...((value as any).frontmatter || {}) } as Frontmatter
      const m = key.match(/([^\/]+)\.mdx$/)
      if (!m) {
        console.error('Name error ', key)
        throw 'Name error?'
      }
      const id = m[1]
      return [id, { id, fm, component: (value as any).default as MDXContent }]
    }),
  )

  const ids = Object.keys(rawFramesById)

  const extendedFmById: { [key: string]: FullFrontmatter } = Object.fromEntries(
    Object.values(rawFramesById).map(({ id, fm }) => {
      let fm2 = { ...fm }
      if (!fm2.title) fm2.title = id
      if (!fm2.z) fm2.z = 0
      if (!fm2.x) fm2.x = 0
      if (!fm2.y) fm2.y = 0
      if (!fm2.layer) fm2.layer = 'fg'
      if (!fm2.hidden) fm2.hidden = false
      if (!fm2.tunnels) fm2.tunnels = {}
      return [id, fm2 as FullFrontmatter]
    }),
  )

  const fmUpdates = $state<{ [key: string]: Partial<Frontmatter> }>({})

  function outputFm(id: string) {
    const fm = fmUpdates[id]
      ? { ...extendedFmById[id], ...fmUpdates[id] }
      : extendedFmById[id]
    return fm
  }

  const outputFrames = $derived(
    ids.map((id) => {
      const fm = fmUpdates[id]
        ? { ...extendedFmById[id], ...fmUpdates[id] }
        : extendedFmById[id]
      const component = rawFramesById[id].component
      return { id, fm, component }
    }),
  )

  const API = getContext('api') as ReturnType<typeof api>

  let tunnelingFrom = $state<{ position: DoorwayPosition; id: string } | null>(
    null,
  )
  let draggingId = $state<string | null>(null)
  let hoveringId = $state<string | null>(null)
  let topZ = $state(generateTopZ())
  let framesTitlesById = $state<{ [key: string]: string }>(
    generateFramesTitles(),
  )

  function findTunnelPositionById(tunnels: Tunnels, testId: string) {
    for (const [pos, id] of Object.entries(tunnels)) {
      if (id === testId) {
        return pos as DoorwayPosition
      }
    }
    return null
  }

  const cmd = {
    updateProps(id: string, frontmatter: Partial<Frontmatter>) {
      rawFramesById[id].fm
      if (fmUpdates[id]) {
        fmUpdates[id] = { ...fmUpdates[id], ...frontmatter }
      } else {
        fmUpdates[id] = frontmatter
      }
    },
    commitProps(id: string) {
      if (fmUpdates[id]) {
        const rawFm = rawFramesById[id].fm
        const newFm = { ...rawFm, ...fmUpdates[id] }
        if (fmUpdates[id].z) {
          topZ = generateTopZ()
        }
        API.setFrameFrontmatter(id, newFm)
      }
    },
    hovering(id: string) {
      hoveringId = id
    },
    setDraggingId(id: string | null) {
      draggingId = id
    },
    startTunnel(fromId: string, fromPosition: DoorwayPosition) {
      tunnelingFrom = { position: fromPosition, id: fromId }
    },
    endTunnel(toId: string, toPosition: DoorwayPosition) {
      if (tunnelingFrom) {
        if (tunnelingFrom.id !== toId) {
          const fromFm = outputFm(tunnelingFrom.id)
          const toFm = outputFm(toId)

          const fromTunnels = { ...fromFm.tunnels }
          const toTunnels = { ...toFm.tunnels }

          const fromExistingTunnel = findTunnelPositionById(fromTunnels, toId)
          if (fromExistingTunnel) {
            delete fromTunnels[fromExistingTunnel]
          }
          fromTunnels[tunnelingFrom.position] = toId

          const toExistingTunnel = findTunnelPositionById(
            toTunnels,
            tunnelingFrom.id,
          )
          if (toExistingTunnel) {
            delete toTunnels[toExistingTunnel]
          }
          toTunnels[toPosition] = tunnelingFrom.id

          cmd.updateProps(tunnelingFrom.id, {
            tunnels: fromTunnels,
          })

          cmd.updateProps(toId, {
            tunnels: toTunnels,
          })

          cmd.commitProps(tunnelingFrom.id)
          cmd.commitProps(toId)
        }
        tunnelingFrom = null
      }
    },
    cancelTunnel() {
      tunnelingFrom = null
    },
    removeTunnel(id: string, position: DoorwayPosition) {
      const fromFm = outputFm(id)
      const fromTunnels = { ...fromFm.tunnels }
      const toId = fromTunnels[position]
      if (toId) {
        const toId = fromTunnels[position]
        const toFm = outputFm(toId!)
        const toTunnels = { ...toFm.tunnels }
        const toPosition = findTunnelPositionById(toTunnels, id)

        delete fromTunnels[position]
        cmd.updateProps(id, {
          tunnels: fromTunnels,
        })

        if (toPosition) {
          delete toTunnels[toPosition]
          cmd.updateProps(toId!, {
            tunnels: toTunnels,
          })
          cmd.commitProps(toId!)
        }

        cmd.commitProps(id)
      }
    },
  }

  const cmdProxy = proxifyCmd(chalk.cyan('[CMD]'), cmd)

  function generateTopZ() {
    return Math.max(...outputFrames.map((f) => f.fm.z || 0))
  }

  function generateFramesTitles() {
    return outputFrames.reduce(
      (acc, f) => {
        acc[f.id] = f.fm.title
        return acc
      },
      {} as { [key: string]: string },
    )
  }

  return {
    cmd: cmdProxy,
    get frames() { return outputFrames }, //prettier-ignore
    get extendedFmById() { return extendedFmById }, //prettier-ignore
    get hoveringId() { return hoveringId }, //prettier-ignore
    get draggingId() { return draggingId }, //prettier-ignore
    get topZ() { return topZ }, //prettier-ignore
    get tunnelingFrom() {
      return tunnelingFrom
    },
    get framesTitlesById() {
      return framesTitlesById
    },
  }
})
