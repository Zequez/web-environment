import { watch } from 'fs'
import { ChildProcess, spawn } from 'child_process'
import fs from 'fs'
import { build } from 'vite'
import viteBuildConfig from './electron/vite.config.ts'

export function startElectron() {
  // Rename ""./node_modules/electron/dist/Electron.app"
  // to "Web Substrate.app"

  function renameElectronApp() {
    const electronAppPath = './node_modules/electron/dist/Electron.app'
    const webSubstrateAppPath = './node_modules/electron/dist/Web Substrate.app'

    if (fs.existsSync(electronAppPath)) {
      fs.renameSync(electronAppPath, webSubstrateAppPath)
    }
  }

  // Watch & Compile ./electron/main.ts and ./electron/preload.ts
  // To ./electron/dist/main.js and ./electron/dist/preload.js

  async function watchAndCompileElectronStuff() {
    watch(
      './back/electron/',
      { recursive: true },
      async (eventType, fileName) => {
        if (fileName && fileName.endsWith('.ts')) {
          console.log(`📝 Arquivo modificado FRAME: ${fileName}`)
          await compileElectronStuff()
          restartElectron()
        }
      },
    )
    await compileElectronStuff()
    restartElectron()
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

  let electronServerProcess: ChildProcess | null = null
  function restartElectron() {
    // `VITE_DEV_SERVER_URL=http://localhost:2332 ./node_modules/electron/dist/Web\ Substrate.app/Contents/MacOS/Electron front/electron-main.js ./back/electron/dist/main.js --args`
    if (electronServerProcess) {
      electronServerProcess.kill()
    }
    electronServerProcess = spawn(
      './node_modules/electron/dist/Web Substrate.app/Contents/MacOS/Electron',
      ['./back/electron/dist/main.js', '--args'],
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          VITE_DEV_SERVER_URL: 'http://localhost:2332',
        },
      },
    )
  }

  renameElectronApp()
  watchAndCompileElectronStuff()
}
