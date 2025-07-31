#! /usr/bin/env bun

// On the root of the web-environment repo
// bun link
// Now you can run the `wenv` script from anywhere

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { createServer, type ViteDevServer } from 'vite'

// Main Process Watchers
// import { startWatch } from '../uplink/watcher'
import { startElectron } from '../electron/start'
import chalk from 'chalk'

import editorGenViteConfig from '@/substrates/editor/vite.config.gen'
import reposGenViteConfig from '@/substrates/repos/vite.config.gen'
import { SERVER_VITE_SPINNER_PORT, UI_PORT_FOR_REPO } from '@/center/ports'

const availableDevServers = {
  editor: editorGenViteConfig,
}

yargs(hideBin(process.argv))
  .scriptName('wenv')
  .command(
    'start',
    'Starts the web environment app (dev mode)',
    (yargs) => {},
    async (argv) => {
      const reposServer = await createServer(reposGenViteConfig())
      await reposServer.listen()

      console.log('REPOS UI SERVER URL', reposServer.resolvedUrls?.local?.[0])

      let reposServers: { [key: string]: ViteDevServer } = {}

      // Get Server for Repo
      const viteSpinnerServer = Bun.serve({
        port: SERVER_VITE_SPINNER_PORT,
        async fetch(req) {
          const url = new URL(req.url)
          const repo = url.pathname.slice(1)
          if (!reposServers[repo]) {
            console.log(`Spinning new vite server for ${repo}`)
            const port = UI_PORT_FOR_REPO(repo)
            reposServers[repo] = await createServer(
              availableDevServers.editor(repo, port),
            )
            await reposServers[repo].listen()
          }
          // Get server URL
          const endpoint = reposServers[repo].resolvedUrls?.local?.[0]

          return new Response(endpoint, { status: 200 })
        },
      })
      console.log(`VITE SPINNING SERVER PORT ${SERVER_VITE_SPINNER_PORT}`)
      //

      const gitServer = startBunWatcherProcess(
        './back/servers/git-server/start.ts',
      )
      const filesServer = startBunWatcherProcess(
        './back/servers/files-server.ts',
      )

      const electronProcess = await startElectron()

      const cleanup = async () => {
        Promise.all([
          reposServer.close(),
          viteSpinnerServer.stop(),

          ...Object.entries(reposServers).map(([key, value]) => value.close()),
        ])

        gitServer.kill()
        filesServer.kill()
        electronProcess.kill()

        console.log('Cleanup finished')
      }

      process.on('SIGINT', cleanup)
      process.on('SIGTERM', cleanup)
      process.on('exit', cleanup)

      await gitServer.exited
      await filesServer.exited
      await electronProcess.exited

      console.log('WEB ENVIRONMENT PROCESS DE-ENERGIZED')
    },
  )
  .demandCommand(1, '')
  .help()
  .parse()

function startBunWatcherProcess(scriptPath: string) {
  console.log(chalk.yellow(`STARTING SERVER ${scriptPath}`))
  return Bun.spawn(['bun', 'run', '--watch', '--no-clear-screen', scriptPath], {
    stdout: 'inherit',
    stderr: 'inherit',
  })
}
