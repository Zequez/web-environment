<script lang="ts" module>
  export type BuildingStatus =
    | { status: 'never' }
    | { status: 'pending'; estimate: number }
    | { status: 'failed'; error: string }
    | {
        status: 'success'
      }

  export type PublishingStatus =
    | { status: 'never' }
    | { status: 'pending'; estimate: number }
    | { status: 'failed'; error: string }
    | {
        status: 'success'
      }
</script>

<script lang="ts">
  import { onMount } from 'svelte'

  import AddRepoInput from './AddRepoInput.svelte'
  import {
    SERVER_GIT_PORT,
    SERVER_PUBLISHING_PORT,
    SERVER_VITE_SPINNER_PORT,
  } from '../../../center/ports'
  import type {
    BackMsg,
    FrontMsg,
    Repo,
  } from '@/mainframe/servers/git-server/messages'

  import type {
    BackMsg as ViteSpinnerBackMsg,
    FrontMsg as ViteSpinnerFrontMsg,
  } from '@/mainframe/servers/vite-spinner/start.ts'

  import GitRemoteDisplay from './common/GitRemoteDisplay.svelte'
  import { tunnel } from '@/center/tunnel'
  import { lsState } from '@/center/utils/runes.svelte'
  import NiftyBtn from './common/NiftyBtn.svelte'
  import { openOnFileExplorer } from '../electron-bridge'
  import CompRepo from './SubRepo/SubRepo.svelte'
  import ThreeDots from '@/center/components/ThreeDots.svelte'
  import FieldRepo from './FieldRepo.svelte'

  let repos: Repo[] = $state<Repo[]>([])
  let gitSocket = $state<WebSocket>(null!)
  let publishingSocket = $state<WebSocket>(null!)
  let viteSpinnerSocket = $state<WebSocket>(null!)

  let mainframeRepo = $derived(repos.find((r) => !r.name) || null)
  let reposOrder = lsState<{ v: string[][] }>('repos-order5', { v: [[]] })
  let subRepos: Repo[] = $derived(repos.filter((r) => r.name))

  let runningViteServers = $state<{ [key: string]: string }>({})

  let buildStatus = lsState<{
    [key: string]: BuildingStatus
  }>('build-status2', {}, (statuses) => {
    for (let k in statuses) {
      if (statuses[k].status === 'pending') {
        statuses[k] = { status: 'never' }
      }
    }
    return statuses
  })

  let buildTimeTracking = lsState<{ [key: string]: number }>(
    'build-time-tracking',
    {},
  )

  let publishingStatus = lsState<{ [key: string]: PublishingStatus }>(
    'publishing-status',
    {},
    (statuses) => {
      for (let k in statuses) {
        if (statuses[k].status === 'pending') {
          statuses[k] = { status: 'never' }
        }
      }
      return statuses
    },
  )

  onMount(() => {
    gitSocket = new WebSocket(`ws://localhost:${SERVER_GIT_PORT}`)
    publishingSocket = new WebSocket(`ws://localhost:${SERVER_PUBLISHING_PORT}`)
    viteSpinnerSocket = new WebSocket(
      `ws://localhost:${SERVER_VITE_SPINNER_PORT}`,
    )

    gitSocket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as BackMsg
        console.log('[GIT] 🔻', data)
        switch (data[0]) {
          case 'repos-list': {
            data[1].forEach((repo: Repo) => {
              if (!repo.name) return
              let found = false
              for (let col of reposOrder.v) {
                if (col.indexOf(repo.name!) !== -1) {
                  found = true
                  break
                }
              }

              if (!found) {
                reposOrder.v[0].push(repo.name!)
              }
            })
            data[1].forEach((repo) => {
              repo.localLogHistory.forEach((log) => {
                log.date = new Date(log.date)
              })
            })
            repos = data[1]
          }
        }
      } catch (e) {
        console.log('Invalid data', e)
        return
      }
      console.log(`Socket message!`, event.data)
    })

    viteSpinnerSocket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as ViteSpinnerBackMsg
        console.log('[VITE SPINNER] 🔻', data)
        switch (data[0]) {
          case 'servers': {
            runningViteServers = data[1]
          }
        }
      } catch (e) {
        console.log('Invalid data', e)
        return
      }
    })
  })

  function gitSend(msg: FrontMsg) {
    gitSocket.send(JSON.stringify(msg))
  }

  function viteSpinnerSend(msg: ViteSpinnerFrontMsg) {
    viteSpinnerSocket.send(JSON.stringify(msg))
  }

  async function cmd(
    ...c:
      | [type: 'add-repo', name: string]
      | [type: 'init-repo-git', name: string]
      | [type: 'remove-repo', name: string]
      | [type: 'duplicate-repo', name: string]
      | [type: 'remove-remote', name: string]
      | [type: 'rename-repo', name: string, newName: string]
      | [type: 'commit', name: string | null, message: string]
      | [type: 'add-remote', name: string, url: string]
      | [type: 'sync', name: string | null]
      | [type: 'fetch', name: string | null]
      | [type: 'fetch-all']
      | [type: 'analyze-all']
      // ---
      | [type: 'build', name: string]
      | [type: 'publish', name: string]
      | [type: 'start-vite', name: string]
      | [type: 'stop-vite', name: string]
  ) {
    switch (c[0]) {
      case 'add-repo': {
        gitSend(['add-repo', c[1]])
        break
      }
      case 'init-repo-git': {
        gitSend(['init-repo-git', c[1]])
        break
      }
      case 'remove-repo': {
        if (confirm('Repo will be moved to trash')) {
          gitSend(['remove-repo', c[1]])
        }
        break
      }
      case 'duplicate-repo': {
        gitSend(['duplicate-repo', c[1]])
        break
      }
      case 'remove-remote': {
        gitSend(['remove-remote', c[1]])
        break
      }
      case 'rename-repo': {
        gitSend(['rename-repo', c[1], c[2]])
        break
      }
      case 'add-remote': {
        gitSend(['add-remote', c[1], c[2]])
        break
      }
      case 'commit': {
        gitSend(['commit', c[1], c[2]])
        break
      }
      case 'sync': {
        gitSend(['sync', c[1]])
        break
      }
      case 'fetch': {
        gitSend(['fetch', c[1]])
        break
      }
      case 'fetch-all': {
        gitSend(['fetch-all'])
        break
      }
      case 'analyze-all': {
        gitSend(['analyze-all'])
        break
      }
      case 'build': {
        buildStatus[c[1]] = {
          status: 'pending',
          estimate: buildTimeTracking[c[1]] || 3,
        }
        const startTime = Date.now()
        const response = await tunnel(
          'mainframe/tunnels/building.ts/buildRepo',
          c[1],
        )
        const endTime = Date.now()
        const buildTime = endTime - startTime
        if (response.success) {
          buildStatus[c[1]] = { status: 'success' }
          if (!buildTimeTracking[c[1]]) {
            buildTimeTracking[c[1]] = buildTime
          } else {
            buildTimeTracking[c[1]] = (buildTimeTracking[c[1]] + buildTime) / 2
          }
        } else {
          buildStatus[c[1]] = { status: 'failed', error: response.error! }
        }

        // viteSpinnerSend(['build', c[1]])
        break
      }
      case 'publish': {
        publishingStatus[c[1]] = { status: 'pending', estimate: 3 }
        const response = await tunnel(
          'mainframe/tunnels/publishing.ts/publishRepo',
          c[1],
        )
        if (response.success) {
          publishingStatus[c[1]] = { status: 'success' }
        } else {
          publishingStatus[c[1]] = { status: 'failed', error: response.error! }
        }
        break
      }
      case 'start-vite': {
        viteSpinnerSend(['start', c[1]])
        break
      }
      case 'stop-vite': {
        viteSpinnerSend(['stop', c[1]])
        break
      }
    }
  }

  function moveRepo(repo: string, direction: 'up' | 'down' | 'left' | 'right') {
    let i = -1
    let j = -1
    for (let k = 0; k < reposOrder.v.length; k++) {
      const l = reposOrder.v[k].indexOf(repo)
      if (reposOrder.v[k].indexOf(repo) !== -1) {
        i = k
        j = l
        break
      }
    }

    if (i === -1 || j === -1) {
      return
    }

    if (direction === 'down' || direction === 'up') {
      let col = [...reposOrder.v[i]]
      if (direction === 'down') {
        if (j === col.length - 1) {
          return
        }
        const [bef, aft] = col.splice(j, 2)
        col.splice(j, 0, aft, bef)
      } else {
        if (j === 0) {
          return
        }
        const [bef, aft] = col.splice(j - 1, 2)
        col.splice(j - 1, 0, aft, bef)
      }
      reposOrder.v[i] = col
    }

    if (direction === 'left' || direction === 'right') {
      let colFrom = [...reposOrder.v[i]]

      if (direction === 'left') {
        if (i === 0) {
          return
        }
        const [repoName] = colFrom.splice(j, 1)
        reposOrder.v.splice(i, 1, colFrom)
        let colTo = [...reposOrder.v[i - 1]]
        colTo.push(repoName)
        reposOrder.v.splice(i - 1, 1, colTo)
      } else if (direction === 'right') {
        const [repoName] = colFrom.splice(j, 1)
        reposOrder.v.splice(i, 1, colFrom)
        if (i === reposOrder.v.length - 1) {
          reposOrder.v.push([repoName])
        } else {
          let colTo = [...reposOrder.v[i + 1]]
          colTo.push(repoName)
          reposOrder.v.splice(i + 1, 1, colTo)
        }
      }
    }
  }
</script>

<div class="flex inset-0 h-full">
  <!-- MAINFRAME BAR -->
  <div class="flex flex-col h-full w-320px relative bg-slate-500 text-white">
    <div class="h-full flex-grow overflow-auto p3 space-y-3">
      <div
        class="font-mono lh-6 uppercase text-shadow-[0_1px_0_#0008] text-center"
      >
        Field Repo
      </div>
      <!-- <p class="text-3 font-mono">Updating from this repository</p> -->
      {#if mainframeRepo}
        <FieldRepo
          repo={mainframeRepo}
          onFetch={() => cmd('fetch', null)}
          onSync={() => cmd('sync', null)}
          onCommit={(msg) => cmd('commit', null, msg)}
        />
      {/if}
      <div class="flex-grow"></div>
    </div>

    <div class=" flex flex-col space-y-3 p3 bg-slate-600 b-t b-black/20">
      <AddRepoInput
        takenNames={repos.filter((r) => r.name).map((r) => r.name!)}
        onConfirm={(name) => cmd('add-repo', name)}
      />
      <div class="b-t b-dashed b-white/50"></div>
      <div class="flex w-full space-x-3">
        <NiftyBtn expand={true} onclick={() => cmd('analyze-all')}
          >Analyze All</NiftyBtn
        >
        <NiftyBtn expand={true} onclick={() => cmd('fetch-all')}
          >Fetch All</NiftyBtn
        >
      </div>
    </div>
  </div>
  <!-- REPOS LIST -->
  <div class="flex-grow flex overflow-auto bg-slate-800">
    {#each reposOrder.v as col, i (i)}
      <div
        class="flex flex-col w-320px flex-shrink-0 space-y-1.5 p1.5"
        aria-label="Column {i}"
      >
        {#each col as repoName, j (j)}
          {@const repo = subRepos.find((r) => r.name === repoName)}
          {#if repo}
            {@const name = repo.name!}
            <CompRepo
              {repo}
              isRunning={runningViteServers[name]}
              onToggleBoot={() => {
                if (runningViteServers[name]) {
                  cmd('stop-vite', name)
                } else {
                  cmd('start-vite', name)
                }
              }}
              buildStatus={buildStatus[name] || { status: 'never' }}
              publishingStatus={publishingStatus[name] || { status: 'never' }}
              onRename={(newName) => cmd('rename-repo', name, newName)}
              onRemoveRemote={() => cmd('remove-remote', name)}
              onDuplicate={() => cmd('duplicate-repo', name)}
              onRemove={() => cmd('remove-repo', name)}
              onCommit={(msg) => cmd('commit', name, msg)}
              onAddRemote={(url) => cmd('add-remote', name, url)}
              onFetch={() => cmd('fetch', name)}
              onSync={() => cmd('sync', name)}
              onBuild={() => cmd('build', name)}
              onPublish={() => cmd('publish', name)}
              onMove={(direction) => moveRepo(name, direction)}
            />
          {/if}
        {/each}
      </div>
    {/each}
  </div>
</div>
