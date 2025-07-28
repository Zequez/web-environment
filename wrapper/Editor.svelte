<script lang="ts">
  import { onMount } from 'svelte'
  import { FILES_SERVER_PORT } from '../back/ports'
  import { type BackMsg } from './files-server'

  let socket = $state<WebSocket>(null!)

  onMount(() => {
    const repo = document.location.pathname.slice(1)

    onMount(() => {
      socket = new WebSocket(`ws://localhost:${FILES_SERVER_PORT}`)

      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data) as BackMsg
          console.log('🔻', data)
          switch (data[0]) {
            case 'files-list': {
              console.log(data)
            }
          }
        } catch (e) {
          console.log('Invalid data', e)
          return
        }
        console.log(`Socket message!`, event.data)
      })
    })
  })
</script>

<div class="flex size-full">
  <div>Files</div>
  <div>Text content</div>
  <div>Blocks content</div>
  <div>Rendered content</div>
</div>
