<script lang="ts">
  import type { Repo } from '@/mainframe/servers/git-server/messages'
  import { tunnel } from '@/center/tunnel'
  import { onMount } from 'svelte'
  import navBg from '../photos/navBg.jpg'

  import { Pin, Canvas, store as canvasStore } from '@/center/canvas'

  let repos: Repo[] = $state<Repo[]>([])
  let CS = canvasStore.initContext({})

  // import { streamTunnel } from '@/center/tunnel'

  onMount(() => {
    updateReposList()
    // streamTunnel<[], string[]>(
    //   'mainframe/tunnels/list-repos.ts/streamListRepos',
    // )((repos) => {
    //   console.log(repos)
    // })
  })

  async function updateReposList() {
    repos = await tunnel('mainframe/tunnels/list-repos.ts')
  }
</script>

<Canvas background={navBg}>
  <!-- <Pin id="origin" data={{ x: 0, y: 0 }} debug={true}></Pin> -->
  <!-- <Pin id="a" data={{ x: -300, y: -300 }} debug={true}>
    <div class="text-gray-700 bg-white p4 rounded-2">Hey</div>
  </Pin> -->
  <!-- <Pin id="b" data={{ x: 200, y: 200 }} debug={true}>
    <div class="text-gray-700 bg-white p4 rounded-2">Hey</div>
  </Pin> -->
</Canvas>

<!-- <div>{JSON.stringify(repos)}</div> -->
