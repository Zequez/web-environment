<script lang="ts">
  import type { Repo } from '@/mainframe/servers/git-server/messages'
  import { tunnel } from '@/center/tunnel'
  import { onMount } from 'svelte'
  import navBg from '../photos/navBg.jpg'
  import reposPos from '../../tunnels/reposPos2.ts'

  import { Pin, Canvas, store as canvasStore } from '@/center/canvas'
  import RepoBlock from './RepoBlock.svelte'

  let loaded = $state(false)
  let repos: Repo[] = $state<Repo[]>([])
  let namedRepos = $derived(repos.filter((repo) => repo.name))
  let CS = canvasStore.initContext({})
  let reposPositions = $state<{ [key: string]: { x: number; y: number } }>({
    ...reposPos,
  })

  console.log('REPOS POS', reposPos)

  // let reposPositions = $derived.by(() => {
  //   return namedRepos.map((repo, i) => {
  //     return {
  //       x: 0,
  //       y: i * 100,
  //     }
  //   })
  // })

  // import { streamTunnel } from '@/center/tunnel'

  onMount(() => {
    // loadReposPosition()
    updateReposList()
    // streamTunnel<[], string[]>(
    //   'mainframe/tunnels/list-repos.ts/streamListRepos',
    // )((repos) => {
    //   console.log(repos)
    // })
  })

  async function updateReposList() {
    const loadedRepos = await tunnel('mainframe/tunnels/list-repos.ts')
    let y = 0
    let changed = false
    console.log(reposPositions)
    loadedRepos.forEach(({ name }) => {
      if (name) {
        if (!reposPositions[name]) {
          changed = true
          reposPositions[name] = { x: 0, y }
          y += 100
        }
      }
    })

    if (changed) {
      await saveRepoPositions()
    }

    repos = loadedRepos

    loaded = true
  }

  async function saveRepoPositions() {
    await tunnel('mainframe/tunnels/saveCanvaReposPositions.ts', reposPositions)
  }

  // async function loadReposPosition() {
  //   // If the file does not exist vite throws error; research how to conditionally import
  //   try {
  //     await import(/* @vite-ignore */ '../../tunnels/reposPos.json')
  //   } catch (e) {
  //     console.log('Position do not exist')
  //   }
  // }
</script>

{#if loaded}
  <Canvas background={navBg}>
    {#each namedRepos as repo, i (repo.name)}
      {@const pos = reposPositions[repo.name!]}
      <Pin id={repo.name!} data={pos}>
        <RepoBlock
          {repo}
          onPosUpdated={(deltaPos) => {
            let oldPos = reposPositions[repo.name!]
            reposPositions[repo.name!] = {
              x: oldPos.x + deltaPos.x,
              y: oldPos.y + deltaPos.y,
            }
            saveRepoPositions()
          }}
        />
      </Pin>
    {/each}
    <!-- <Pin id="origin" data={{ x: 0, y: 0 }} debug={true}></Pin> -->
    <!-- <Pin id="a" data={{ x: -300, y: -300 }} debug={true}>
    <div class="text-gray-700 bg-white p4 rounded-2">Hey</div>
  </Pin> -->
    <!-- <Pin id="b" data={{ x: 200, y: 200 }} debug={true}>
    <div class="text-gray-700 bg-white p4 rounded-2">Hey</div>
  </Pin> -->
  </Canvas>
{:else}
  <div class="absolute size-full bg-gray-100 text-12 flexcc"
    >Reading repos...</div
  >
{/if}
<!-- <div>{JSON.stringify(repos)}</div> -->
