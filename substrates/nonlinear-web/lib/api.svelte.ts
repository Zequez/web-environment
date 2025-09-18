import type { BackMsg, FrontMsg } from '@/mainframe/servers/files-server'
import { SERVER_FILES_PORT } from '@/center/ports'
import { onMount } from 'svelte'
import { stringify } from 'yaml'

function framePath(id: string) {
  return `repos/ezequiel/frames/${id}.mdx`
}

export default function api() {
  let socket = $state<WebSocket | null>(null)

  onMount(() => {
    if (!import.meta.env.DEV) return
    socket = new WebSocket(`ws://localhost:${SERVER_FILES_PORT}?repo=ezequiel`)
  })

  async function readFrameById(frameId: string): Promise<string | null> {
    if (!socket) return null

    return new Promise((resolve, reject) => {
      const filePath = framePath(frameId)

      function grabFileContent(ev: MessageEvent<any>) {
        const data = JSON.parse(ev.data) as BackMsg
        if (data[0] === 'file-content' && data[1] === filePath) {
          resolve(data[2])
          socket!.removeEventListener('message', grabFileContent)
        }
      }
      socket!.addEventListener('message', grabFileContent)

      sendMsg(['read-file', filePath])
    })

    // Wait until file-content event is received
  }

  function sendMsg(msg: FrontMsg) {
    if (!socket) return
    socket.send(JSON.stringify(msg))
  }

  async function setFrameFrontmatter(
    id: string,
    frontmatter: Record<string, any>,
  ) {
    if (!socket) return
    const content = await readFrameById(id)
    if (content) {
      const newFileContent = updateFileFrontmatter(content, frontmatter)

      sendMsg(['write-file', framePath(id), newFileContent])
    }
  }

  function updateFileFrontmatter(
    content: string,
    frontmatter: Record<string, any>,
  ) {
    const frontMatterString = `---\n${stringify(frontmatter).trim()}\n---`
    let newContent = content.replace(/^---[\s\S]*?---/, frontMatterString)

    if (newContent === content) {
      newContent = `${frontMatterString}\n\n${content}`
    }

    return newContent
  }

  return {
    setFrameFrontmatter,
  }
}
