import chalk from 'chalk'

import { UPLINK_PORT, VITE_PORT } from '../ports'
import { type UplinkCmd, run } from './commands'

const allowed = ['http://localhost:2332']

function start() {
  const server = Bun.serve({
    port: UPLINK_PORT,
    async fetch(req) {
      if (req.method === 'OPTIONS') {
        return new Response(null, {
          status: 204, // No Content
          headers: {
            'Access-Control-Allow-Origin': allowed.join(', '),
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        })
      }

      const parsedBody = await req.text()
      const data = JSON.parse(parsedBody) as UplinkCmd
      console.log('🔻 Uplink:\n', chalk.yellow(JSON.stringify(data, null, 2)))
      const startTime = Date.now()
      const result = await run(data)
      const endTime = Date.now()
      console.log('🟩 Uplink:\n', chalk.green(JSON.stringify(result, null, 2)))
      console.log(
        chalk.gray(
          `🕒 Tempo de execução: ${((endTime - startTime) / 1000).toFixed(2)}s`,
        ),
      )

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowed.join(', '),
        },
      })
    },
  })

  console.log(
    `O servidor de uplink está em execução  http://localhost:${UPLINK_PORT}`,
  )

  return server
}

export { start }
