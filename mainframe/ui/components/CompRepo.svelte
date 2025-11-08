<script lang="ts">
  import type { Repo } from '@/mainframe/servers/git-server/messages'
  import BootToggle from './BootToggle.svelte'
  import MoveThingy from './MoveThingy.svelte'
  import EllipsisVerticalIcon from '~icons/fa6-solid/ellipsis-vertical'
  import { tick } from 'svelte'
  import { openInBrowser, openOnFileExplorer } from '../electron-bridge'
  import LocalhostLink from './LocalhostLink.svelte'
  import UncommittedChangesLogger from './UncommittedChangesLogger.svelte'
  import SetupRemote from './SetupRemote.svelte'
  import GitRemoteDisplay from './GitRemoteDisplay2.svelte'
  import FetchedButton from './FetchedButton.svelte'
  import SyncButton from './SyncButton.svelte'
  import NiftyBtn from './NiftyBtn.svelte'
  import NiftyInput from './NiftyInput.svelte'

  const p: {
    repo: Repo
    isRunning: string
    onToggleBoot: () => void
    onRename: (newName: string) => void
    menuOpen: boolean
    onClickMenu: () => void
    onRemoveRemote: () => void
    onDuplicate: () => void
    onRemove: () => void
    onCommit: (msg: string) => void
    onAddRemote: (url: string) => void
    onFetch: () => void
    onSync: () => void
    onBuild: () => void
    onPublish: () => void
    onMove: (dir: 'up' | 'down' | 'left' | 'right') => void
  } = $props()

  const repo = $derived(p.repo)
  const syncStatus = $derived(
    repo.status[0] === 'git-full' ? repo.status[2] : null,
  )
  const name = $derived(repo.name!)

  let isRenaming = $state<{ from: string; to: string } | null>(null)

  async function startRenaming(repo: string) {
    isRenaming = {
      from: repo,
      to: repo,
    }
    await tick()
    document.getElementById('rename-input')!.focus()
  }

  function doneRenaming() {
    if (isRenaming) {
      if (isRenaming.from !== isRenaming.to) {
        p.onRename(isRenaming.to)
      }
      isRenaming = null
    }
  }
</script>

<div class="bg-gray-200 p-0 w-full rounded-1 shadow-[0_0_0_1px_#0006]">
  <!-- HEADER -->
  <div class="bg-gray-700 rounded-t-1 flexcc relative px1.5 space-x-1.5 group">
    <BootToggle
      status={p.isRunning ? 'on' : 'off'}
      onclick={() => p.onToggleBoot()}
    />
    <div
      class="relative font-mono h8 flexcs flex-grow text-white text-xs w30 flex-shrink-0 overflow-hidden text-ellipsis"
    >
      <span>{name}</span>
      {#if isRenaming && name === isRenaming.from}
        <input
          type="text"
          bind:value={isRenaming.to}
          id="rename-input"
          onkeypress={(ev) => {
            if (ev.key === 'Enter') {
              doneRenaming()
            } else if (ev.key === 'Escape') {
              isRenaming = null
            }
          }}
          onblur={() => doneRenaming()}
          class="absolute inset-y-1.5 left-0 right-0 bg-gray-800 b b-white/60 text-white font-mono text-3 outline-none"
        />
      {/if}
    </div>
    <div class="opacity-0 group-hover:opacity-100">
      <MoveThingy
        onUp={() => p.onMove('up')}
        onDown={() => p.onMove('down')}
        onLeft={() => p.onMove('left')}
        onRight={() => p.onMove('right')}
      />
    </div>
    <button
      onclick={() => p.onClickMenu()}
      class="text-white/60 rounded-1 h6 w6 flexcc hover:(bg-white/10 text-white/80)"
    >
      <EllipsisVerticalIcon />
    </button>
    {#if p.menuOpen}
      <div
        class="absolute flex flex-col whitespace-nowrap font-mono text-3 top-0 py1 text-black/75 left-full -ml1 mt1 bg-gray-200 b b-black/10 rounded-sm shadow-md z-100"
        id="ellipsis-menu"
      >
        <button
          onclick={() => openOnFileExplorer(repo.name)}
          class="block text-left px1.5 hover:bg-black/10"
        >
          Open Filesystem
        </button>
        {#if repo.status[0] === 'git-full'}
          <button
            onclick={() => p.onRemoveRemote()}
            class="block text-left px1.5 hover:bg-black/10"
          >
            Remove Remote
          </button>
        {/if}
        <button
          onclick={() => startRenaming(repo.name!)}
          class="block text-left px1.5 hover:bg-black/10"
        >
          Rename
        </button>
        <button
          onclick={() => p.onDuplicate()}
          class="block text-left px1.5 hover:bg-black/10"
        >
          Duplicate
        </button>
        <button
          onclick={() => p.onRemove()}
          class="block text-left px1.5 hover:bg-black/10"
        >
          Delete
        </button>
      </div>
    {/if}
  </div>
  <div class="flex flex-col space-y-1.5 p1.5">
    <!-- VITE CONTROL -->
    {#if p.isRunning}
      <LocalhostLink localUrl={p.isRunning} />
    {/if}
    <!-- <div class="">
              <div class="flexcs space-x-1">
                {#if runningViteServers[repo.name!]}
                  <a
                    href={runningViteServers[repo.name!]}
                    onclick={(ev) => {
                      ev.preventDefault()
                      electronAPI.openExternal(runningViteServers[repo.name!])
                    }}
                    class="bg-gray-300 hover:bg-black/20 text-black/80 text-xs rounded-sm px1 py0.5"
                  >
                    {runningViteServers[repo.name!]}
                  </a>
                {/if}
              </div>
            </div> -->
    <!-- UNCOMMITTED CHANGES -->
    {#if repo.uncommittedChanges}
      <div class="">
        <UncommittedChangesLogger
          onConfirm={(msg) => {
            p.onCommit(msg)
          }}
          changes={repo.uncommittedChanges}
        />
      </div>
    {/if}
    <!-- GIT REMOTE -->
    {#if repo.status[0] === 'git'}
      <SetupRemote
        repoName={repo.name!}
        onConfirm={(url) => p.onAddRemote(url)}
      />
    {:else if repo.status[0] === 'git-full'}
      <GitRemoteDisplay url={repo.status[1]} />
      <div class="flexce relative">
        <FetchedButton
          lastFetchedAt={repo.lastFetchedAt}
          isFetching={repo.fetching}
          onFetch={() => p.onFetch()}
        />
        <div class="flex-grow"></div>
        <SyncButton status={syncStatus} onAction={() => p.onSync()} />
        {#if repo.mergeConflicts}
          <div
            class="bg-red-500 inset-0 absolute rounded-md text-white z-50 text-xs flexcc"
          >
            Merge conflict
          </div>
        {/if}
      </div>
    {/if}

    <!-- PUBLISHING -->
    {#if repo.wenv?.cname && repo.status[0] === 'git-full'}
      <div class="flex flex-col space-y-1.5">
        {#if repo.name}
          <div class="flex space-x-1.5">
            <NiftyBtn color="yellow" expand={true} onclick={() => p.onBuild()}
              >Build</NiftyBtn
            >
            <NiftyBtn color="sky" expand={true} onclick={() => p.onPublish()}
              >Publish</NiftyBtn
            >
          </div>
          <NiftyInput
            value={repo.wenv.cname}
            disabled={true}
            class="font-mono text-center text-3 lh-6"
          />
          {#if repo.status[0] === 'git-full' && repo.status[1].match(/github/)}
            <div class="h6 text-center">
              <button
                class="text-3 underline underline-dashed font-mono hover:underline-solid hover:text-sky-500"
                onclick={() =>
                  openInBrowser(
                    repo.status[1]!.replace(/.git$/, '') + '/settings/pages',
                  )}>Setup branch www on Github Pages</button
              >
            </div>
          {/if}
        {/if}
      </div>
    {/if}
  </div>
</div>
