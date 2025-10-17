if (typeof globalThis.window === 'undefined') {
  ;(globalThis as any).window = {
    addEventListener() {
      console.warn('MOCK addEventListener')
    },
    removeEventListener() {
      console.warn('MOCK removeEventListener')
    },
    matchMedia() {
      console.warn('MOCK matchMedia')
      return { matches: false, addListener() {}, removeListener() {} }
    },
    requestAnimationFrame(cb: Function) {
      console.warn('MOCK requestAnimationFrame')
      return setTimeout(cb, 0)
    },
    cancelAnimationFrame(id: number) {
      console.warn('MOCK cancelAnimationFrame')
      clearTimeout(id)
    },
    scrollTo() {
      console.warn('MOCK scrollTo')
    },
    // ...add whatever minimal surface you need
  } as unknown as Window

  // globalThis.document = {
  //   createElement() {
  //     console.warn('MOCK createElement')
  //     return {}
  //   },
  //   querySelector() {
  //     console.warn('MOCK querySelector')
  //     return null
  //   },
  //   body: {},
  //   // ...
  // } as unknown as Document
}
