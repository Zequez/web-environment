import type { ChalkInstance } from 'chalk'

export default function runWatchProcess(
  title: string,
  color: ChalkInstance,
  scriptPath: string,
) {
  console.log(`STARTING PROCESS`, color(`[${title}]`), scriptPath)
  const ps = Bun.spawn(
    ['bun', 'run', '--watch', '--no-clear-screen', scriptPath],
    {
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ...process.env,
        FORCE_COLOR: '1',
      },
    },
  )

  function prefixStream(
    stream: ReadableStream<Uint8Array>,
    target: typeof Bun.stdout | typeof Bun.stderr,
  ) {
    ;(async () => {
      const reader = stream.getReader()
      const prefixBytes = new TextEncoder().encode(color(`[${title}] `))
      let buffer = new Uint8Array(0)

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          if (buffer.length > 0) {
            await Bun.write(target, prefixBytes)
            await Bun.write(target, buffer)
            await Bun.write(target, new TextEncoder().encode('\n'))
          }
          break
        }

        // append new chunk to buffer
        const newBuffer = new Uint8Array(buffer.length + value.length)
        newBuffer.set(buffer)
        newBuffer.set(value, buffer.length)
        buffer = newBuffer

        // search for newlines in raw bytes
        let start = 0
        for (let i = 0; i < buffer.length; i++) {
          if (buffer[i] === 10 /* '\n' */) {
            const line = buffer.slice(start, i + 1) // include newline
            await Bun.write(target, prefixBytes)
            await Bun.write(target, line)
            start = i + 1
          }
        }

        // keep remainder
        buffer = buffer.slice(start)
      }
    })()
  }

  prefixStream(ps.stdout, Bun.stdout)
  prefixStream(ps.stderr, Bun.stderr)

  return wrapProcess(title, color, ps)
}

function wrapProcess(
  title: string,
  color: ChalkInstance,
  ps: { kill: () => void; exited: Promise<any> },
) {
  return {
    title,
    kill: () => {
      ps.kill()
    },
    async waitUntilItEnds() {
      const result = await ps.exited
      console.log(`PROCESS`, color(`[${title}]`), `DE-ENERGIZED`)
      return result
    },
    ps,
  }
}
