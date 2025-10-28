<script lang="ts">
  import type { Repo } from '@/mainframe/servers/git-server/messages'
  import { tunnel } from '@/center/tunnel'
  import { onMount } from 'svelte'

  let repos: Repo[] = $state<Repo[]>([])

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

<div>{JSON.stringify(repos)}</div>
