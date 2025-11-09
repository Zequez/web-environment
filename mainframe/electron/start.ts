import { watch } from 'fs'
import fs from 'fs'
import { build } from 'vite'
import viteBuildConfig from './vite.config.ts'
import { APP_NAME } from './config.ts'
import { wait } from '@/center/utils/neutral.ts'

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
      './mainframe/electron/',
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
      entrypoints: ['./mainframe/electron/main.ts'],
      outdir: './mainframe/electron/dist',
      target: 'node',
      external: ['electron'],
    })

    await build(viteBuildConfig)
  }

  // Start or restart electron process

  let electronServerProcess: ReturnType<
    typeof Bun.spawn<{
      stdout: 'pipe'
      stderr: 'inherit'
    }>
  > = null!
  let isRestarting = false
  function restartElectron() {
    console.log('ELECTRON RESTARTING')
    isRestarting = true
    if (electronServerProcess) {
      electronServerProcess.kill()
    }
    electronServerProcess = Bun.spawn(
      [
        `./node_modules/electron/dist/${APP_NAME}.app/Contents/MacOS/Electron`,
        './mainframe/electron/dist/main.js',
        '--args',
      ],
      {
        stdout: 'pipe',
        stderr: 'inherit',
        detached: false,
      },
    )

    const decoder = new TextDecoder()
    ;(async () => {
      const reader = electronServerProcess.stdout!.getReader()
      while (true && electronServerProcess.killed === false) {
        const { value, done } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        process.stdout.write(text)
        if (text.match(/ELECTRON_CLOSE_SIGNAL/)) {
          console.log('RECEIVED SIGNAL KILLING WATCHER')
          process.kill(process.ppid, 'SIGTERM')
        }
      }
    })()

    isRestarting = false
  }

  renameElectronApp()
  const watcher = await watchAndCompileElectronStuff()

  return {
    kill: () => {
      electronServerProcess?.kill()
      watcher.close()
    },
    get exited() {
      return new Promise(async (resolve, reject) => {
        async function waitForExit() {
          await electronServerProcess.exited
          if (isRestarting) {
            console.log('Electron restarting')
            await wait(100)
            await waitForExit()
          } else {
            console.log('Electron quitted')
            watcher.close()
          }
        }
        await waitForExit()
        resolve(true)
      })
    },
  }
}

startElectron()
