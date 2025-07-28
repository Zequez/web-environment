#! /usr/bin/env bun

// On the root of the web-substrate repo
// bun link
// bun link web-substrate-mainframe
// Now you can run the `wesma` script from anywhere

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
// import { exists } from 'fs/promises'
// import path from 'path'
// import { DIST_ROOT, LAND_ROOT } from '../paths'
// import chalk from 'chalk'
// import { build } from 'vite'
// import { generateConfig } from '../../vite.config'
// import { Elysia } from 'elysia'
// import { staticPlugin } from '@elysiajs/static'

// Main Process Watchers
import { startWatch } from '../uplink/watcher'
import { startVite } from '../vite-server'
import { startWrapper } from '../wrapper-server'
import { startElectron } from '../electron'
// import { start as startFileServer } from '../../wrapper/files-server'

yargs(hideBin(process.argv))
  .scriptName('wenv')
  .command(
    'start',
    'Starts the web environment app (dev mode)',
    (yargs) => {},
    async (argv) => {
      startWatch()
      startVite()
      startWrapper()
      startElectron()
      // startFileServer()

      console.log('STARTING FILE SERVER')
      const wrapperServer = Bun.spawn(
        [
          'bun',
          'run',
          '--watch',
          '--no-clear-screen',
          './wrapper/files-server.ts',
        ],
        {
          stdout: 'inherit',
          stderr: 'inherit',
        },
      )

      const cleanup = () => {
        wrapperServer.kill()
      }

      await wrapperServer.exited

      process.on('SIGINT', cleanup)
      process.on('SIGTERM', cleanup)
      process.on('exit', cleanup)

      console.log('Goodbye!')
    },
  )
  .demandCommand(1, '')
  .help()
  .parse()
