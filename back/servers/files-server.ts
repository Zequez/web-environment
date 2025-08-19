import chalk from 'chalk'
import { createWebsocketServer } from '@/back/basic-websocket'
import { SERVER_FILES_PORT } from '../../center/ports'
import {
  existsSync,
  watch,
  type FSWatcher,
  readFileSync,
  writeFileSync,
} from 'fs'
import dirTree, { type DirectoryTree } from 'directory-tree'
import { isBinary } from '../../node_modules/istextorbinary' // I have no idea why using istextorbinary throws TypeScript off

export type BackMsg =
  | ['files-tree', DirectoryTree]
  | ['file-content', path: string, content: string]
export type FrontMsg =
  | ['write-file', filePath: string, content: string]
  | ['move-file']
  | ['delete-file']
  | ['read-file', filePath: string]

function start() {
  const server = createWebsocketServer<FrontMsg, BackMsg, { repo: string }>({
    port: SERVER_FILES_PORT,
    onMessage: (msg, params, sendMsg) => {
      const basePath = `repos/${params.repo}`
      if (!existsSync(basePath)) {
        return
      }

      switch (msg[0]) {
        case 'write-file':
          const [, path, content] = msg
          writeFileSync(path, content)
          break
        case 'move-file':
        case 'delete-file':
          break
        case 'read-file':
          console.log(msg[1])
          if (msg[1].startsWith(basePath)) {
            if (isBinary(msg[1])) {
            } else {
              const fileContent = readFileSync(msg[1], 'utf8')
              sendMsg(['file-content', msg[1], fileContent])
            }
          }
          break
      }
    },
    onConnect: async (sendMsg, params) => {
      // Send files list and updates
      let closeWatcher = watchForTree(`./repos/${params.repo}`, (tree) => {
        sendMsg(['files-tree', tree])
      })

      return closeWatcher
    },
  })

  return server
}

start()

function watchForTree(
  dirPath: string,
  cb: (tree: DirectoryTree) => void,
): () => void {
  let maybeWatcher: FSWatcher | null = null

  if (existsSync(dirPath)) {
    maybeWatcher = watch(
      dirPath,
      { recursive: true },
      (eventType, fileName) => {
        if (!fileName) return
        if (fileName.startsWith('.git')) return
        console.log('📝 Arquivo modificado: ', fileName)
        cb(readTree(dirPath))
      },
    )
    cb(readTree(dirPath))
  } else {
    console.error('File path does not exist', dirPath)
  }
  return () => {
    if (maybeWatcher) {
      maybeWatcher.close()
    }
  }
}

function readTree(dirPath: string) {
  return dirTree(dirPath, {
    normalizePath: true,
    // ignore .git
    exclude: /\.git/,
  })
}
