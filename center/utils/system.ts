import { parse, stringify } from 'yaml'
import fs from 'fs'
import net from 'net'
import path from 'path'

export const $path = (p: string) => path.resolve(__dirname, '../../', p)

export function yamlFileStore<T>(path: string, initial: T) {
  let data: T = null!

  function save(data: T) {
    fs.writeFileSync(path, stringify(data))
  }

  function load(): T | null {
    if (fs.existsSync(path)) {
      const content = fs.readFileSync(path, 'utf-8')
      if (content) {
        return parse(content) as T
      }
    }

    return null
  }

  // function refresh() {
  //   data = load()!
  // }

  const loaded = load()
  if (!loaded) {
    data = initial
    save(data)
  } else {
    data = loaded
  }

  return {
    get value() {
      return data
    },
    set value(newVal: T) {
      data = newVal
      save(data)
    },
  }
}

export function isPortUsed(port: number) {
  return new Promise((resolve, reject) => {
    const server = net.createServer()

    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true) // Port is in use
      } else {
        reject(err) // Other error occurred
      }
    })

    server.once('listening', () => {
      server.close(() => {
        resolve(false) // Port is free
      })
    })

    server.listen(port)
  })
}
