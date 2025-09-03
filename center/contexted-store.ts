import { getContext, setContext } from 'svelte'

const contexts = new Map<string, any>()
export function getContexts() {
  return contexts
}

export default function createContextedStore<TConfig, KStoreContext>(
  contextName: string,
  init: (config: TConfig) => KStoreContext,
) {
  function initStoreContext(config: TConfig) {
    const store = init(config)
    contexts.set(contextName, store)
    setContext(contextName, store)
    return store
  }

  function getStoreContext() {
    return getContext(contextName) as KStoreContext
  }

  return {
    initContext: initStoreContext,
    getContext: getStoreContext,
  }
}

export function proxifyCmd<
  K extends Record<string | symbol, (...args: any[]) => any>,
>(prefix: string, cmd: K) {
  return new Proxy(cmd, {
    get: (target, prop: keyof typeof cmd, receiver) => {
      return (...args: Parameters<(typeof cmd)[keyof typeof cmd]>) => {
        console.log(prefix, prop, args)
        return (target[prop] as any)(...args)
      }
    },
  })
}
