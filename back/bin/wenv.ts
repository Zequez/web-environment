#! /usr/bin/env bun

// On the root of the web-environment repo
// bun link
// Now you can run the `wenv` script from anywhere

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

// Main Process Watchers
// import { startWatch } from '../uplink/watcher'
import { startElectron } from '../electron/start'
import chalk, { type ChalkInstance } from 'chalk'
import runWatchProcess from '../run-watch-process'

// async function createViteServer(config: InlineConfig) {
//   const server = await createServer(config)
//   await server.listen()
//   return {
//     server,
//     url: server.resolvedUrls!.local![0],
//     async stop() {
//       await server.close()
//     },
//     get exited() {
//       return Promise.resolve(true)
//     }
//   }
// }

yargs(hideBin(process.argv))
  .scriptName('wenv')
  .command(
    'start',
    'Starts the web environment app (dev mode)',
    (yargs) => {},
    async (argv) => {
      console.log(chalk.bgBlackBright('MAIN PROCESS STARTING'))
      // let reposServers: { [key: string]: ViteDevServer } = {}

      // function runningServersUrls() {
      //   return Object.fromEntries(
      //     Object.entries(reposServers).map(([key, value]) => [
      //       key,
      //       value.resolvedUrls?.local?.[0]!,
      //     ]),
      //   )
      // }

      // // Get Server for Repo
      // const viteSpinnerServer = Bun.serve({
      //   port: SERVER_VITE_SPINNER_PORT,
      //   async fetch(req) {
      //     const url = new URL(req.url)
      //     const repo = url.pathname.slice(1)

      //     if (repo) {
      //       if (!reposServers[repo]) {
      //         console.log(`Spinning new vite server for ${repo}`)
      //         const port = UI_PORT_FOR_REPO(repo)
      //         reposServers[repo] = await createServer(
      //           editorGenViteConfig(repo, port),
      //         )
      //         await reposServers[repo].listen()
      //       }
      //       // Get server URL
      //       const endpoint = reposServers[repo].resolvedUrls?.local?.[0]

      //       return new Response(endpoint, { status: 200 })
      //     } else {
      //       return new Response(JSON.stringify(runningServersUrls()), {
      //         status: 200,
      //       })
      //     }
      //   },
      // })
      // console.log(`VITE SPINNING SERVER PORT ${SERVER_VITE_SPINNER_PORT}`)
      const servers = {
        mainframeVite: runWatchProcess(
          'Mainframe Vite',
          chalk.magenta,
          './back/servers/mainframe-vite.ts',
        ),
        viteSpinner: runWatchProcess(
          'Vite Spinner',
          chalk.rgb(160, 32, 240),
          './back/servers/vite-spinner.ts',
        ),
        git: runWatchProcess(
          'GIT',
          chalk.green,
          './back/servers/git-server/start.ts',
        ),
        files: runWatchProcess(
          'Files',
          chalk.yellow,
          './back/servers/files-server.ts',
        ),
        publishing: runWatchProcess(
          'Publishing',
          chalk.rgb(255, 165, 0),
          './back/servers/publishing-server.ts',
        ),
        electron: runWatchProcess(
          'Electron',
          chalk.rgb(145, 188, 240),
          './back/electron/start.ts',
        ),
      }

      const cleanup = async () => {
        Object.values(servers).map((s) => s.kill())
        console.log('Cleanup finished')
      }

      process.on('SIGINT', cleanup)
      process.on('SIGTERM', cleanup)
      process.on('exit', cleanup)

      await Promise.all(
        Object.entries(servers).map(([key, value]) => value.waitUntilItEnds()),
      )

      console.log(chalk.bgBlackBright('MAIN PROCESS DE-ENERGIZED'))
    },
  )
  .demandCommand(1, '')
  .help()
  .parse()
