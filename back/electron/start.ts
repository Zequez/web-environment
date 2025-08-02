import { watch } from 'fs'
import fs from 'fs'
import { build } from 'vite'
import viteBuildConfig from './vite.config.ts'
import { APP_NAME } from './config.ts'

export async function startElectron() {
  // Rename ""./node_modules/electron/dist/Electron.app"
  // So it shows up like that on the Mac dock

  function renameElectronApp() {
    const electronAppPath = './node_modules/electron/dist/Electron.app'
    const webSubstrateAppPath = `./node_modules/electron/dist/${APP_NAME}.app`

    if (fs.existsSync(electronAppPath)) {
      fs.renameSync(electronAppPath, webSubstrateAppPath)
    }
  }

  // Watch & Compile ./electron/main.ts and ./electron/preload.ts
  // To ./electron/dist/main.js and ./electron/dist/preload.js

  async function watchAndCompileElectronStuff() {
    const watcher = watch(
      './back/electron/',
      { recursive: true },
      async (eventType, fileName) => {
        if (fileName && fileName.endsWith('.ts')) {
          await compileElectronStuff()
          restartElectron()
        }
      },
    )
    await compileElectronStuff()
    restartElectron()
    return watcher
  }

  // Compile ./electron/main.ts and ./electron/preload.ts using Bun to ./electron/dist
  async function compileElectronStuff() {
    await Bun.build({
      entrypoints: ['./back/electron/main.ts'],
      outdir: './back/electron/dist',
      target: 'node',
      external: ['electron'],
    })

    await build(viteBuildConfig)
  }

  // Start or restart electron process

  let electronServerProcess: ReturnType<
    typeof Bun.spawn<{
      stdout: 'inherit'
      stderr: 'inherit'
    }>
  > | null = null
  function restartElectron() {
    if (electronServerProcess) {
      electronServerProcess.kill()
    }
    electronServerProcess = Bun.spawn(
      [
        `./node_modules/electron/dist/${APP_NAME}.app/Contents/MacOS/Electron`,
        './back/electron/dist/main.js',
        '--args',
      ],
      {
        stdout: 'inherit',
        stderr: 'inherit',
      },
    )
  }

  renameElectronApp()
  const watcher = await watchAndCompileElectronStuff()

  return {
    kill: () => {
      electronServerProcess?.kill()
      watcher.close()
    },
    get exited() {
      if (electronServerProcess === null) {
        return Promise.resolve(true)
      } else {
        return electronServerProcess.exited
      }
    },
  }
}
