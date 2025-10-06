#! /usr/bin/env bun

// On the root of the web-environment repo
// bun link
// Now you can run the `wenv` script from anywhere

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import chalk, { type ChalkInstance } from 'chalk'
import runWatchProcess from '../run-watch-process'

function printTitle(title: string, color: ChalkInstance) {
  const eq = title.replace(/./g, '=')
  console.log(color(eq))
  console.log(color(title))
  console.log(color(eq))
}

yargs(hideBin(process.argv))
  .scriptName('wenv')
  .command(
    'start',
    'Starts the web environment app (dev mode)',
    (yargs) => {},
    async (argv) => {
      printTitle('MAIN PROCESS STARTING', chalk.yellowBright)
      console.log('\n')

      const servers = {
        mainframeVite: runWatchProcess(
          'Mainframe Vite',
          chalk.magenta,
          './mainframe/servers/mainframe-vite.ts',
        ),
        viteSpinner: runWatchProcess(
          'Vite Spinner',
          chalk.rgb(160, 32, 240),
          './mainframe/servers/vite-spinner/start.ts',
        ),
        git: runWatchProcess(
          'GIT',
          chalk.green,
          './mainframe/servers/git-server/start.ts',
        ),
        files: runWatchProcess(
          'Files',
          chalk.yellow,
          './mainframe/servers/files-server.ts',
        ),
        // publishing: runWatchProcess(
        //   'Publishing',
        //   chalk.rgb(255, 165, 0),
        //   './mainframe/servers/publishing-server.ts',
        // ),
        electron: runWatchProcess(
          'Electron',
          chalk.rgb(145, 188, 240),
          './mainframe/electron/start.ts',
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

      console.log('\n')
      printTitle('MAIN PROCESS DE-ENERGIZED', chalk.yellowBright)
    },
  )
  .demandCommand(1, '')
  .help()
  .parse()
