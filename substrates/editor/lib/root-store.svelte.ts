import chalk from 'chalk'
import createContextedStore from '../../../center/contexted-store'

type SecondTunnel = {
  n?: string
  e?: string
  s?: string
  w?: string
}

export default createContextedStore('root', () => {
  let editMode = $state(localStorage.getItem('edit-mode') === 'true')
  let tunnelingOverlay = $state(false)
  let tentativeTunnel = $state<string | null>(null)
  let backgroundMode = $state(false)

  $effect(() => {
    localStorage.setItem('edit-mode', editMode ? 'true' : 'false')
  })

  const cmd = {
    toggleEditMode() {
      editMode = !editMode
    },
    toggleTunnelingOverlay() {
      tunnelingOverlay = !tunnelingOverlay
    },
    temptTunnel(direction: string | null) {
      tentativeTunnel = direction
    },
    toggleBackgroundMode() {
      backgroundMode = !backgroundMode
    },
  }

  const cmdProxy = new Proxy(cmd, {
    get: (target, prop: keyof typeof cmd, receiver) => {
      return (...args: Parameters<(typeof cmd)[keyof typeof cmd]>) => {
        console.log(chalk.red('[CMD]'), prop, args)
        return (target[prop] as any)(...args)
      }
    },
  })

  return {
    cmd: cmdProxy,
    get editMode() {
      return editMode
    },
    get tunnelingOverlay() {
      return tunnelingOverlay
    },
    get tentativeTunnel() {
      return tentativeTunnel
    },
    get backgroundMode() {
      return backgroundMode
    },
  }
})
