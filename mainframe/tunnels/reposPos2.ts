import reposPos from './reposPos.json'

if (import.meta.hot) {
  // When the JSON file changes, accept the update quietly
  import.meta.hot.accept(() => {
    // Do nothing — prevents full reload
    console.debug('reposPos.json changed — ignoring HMR update')
  })
}

export default reposPos as { [key: string]: { x: number; y: number } }
