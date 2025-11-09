<script lang="ts">
  import FolderIcon from '~icons/fa6-solid/folder-open'
  import type { Repo } from '@/mainframe/servers/git-server/messages'
  import { openOnFileExplorer } from '../electron-bridge'
  import GitRemoteDisplay from './common/GitRemoteDisplay.svelte'
  import ThreeDots from '@/center/components/ThreeDots.svelte'
  import FetchNSync from './SubRepo/versioning/FetchNSync.svelte'
  import UncommittedChangesLogger from './SubRepo/versioning/UncommittedChangesLogger.svelte'
  import { lsState } from '@/center/utils/runes.svelte'

  const {
    repo,
    onFetch,
    onSync,
    onCommit,
  }: {
    repo: Repo
    onFetch: () => void
    onSync: () => void
    onCommit: (msg: string) => void
  } = $props()

  const status = $derived(repo.status)
  const localChangesToggled = lsState('mainframe-local-changes-toggle', {
    v: false,
  })

  const parsedChanges = $derived.by(() => {
    if (repo.uncommittedChanges) {
      const cleanLines = repo.uncommittedChanges
        .split('\n')
        .map((line) => {
          const m = line.trim().match(/^([^ ]) (.*)/)
          if (m) {
            const path = m[2]
            const pathParts = path.split('/')
            const fileName = pathParts.pop()!
            return {
              action: m[1],
              path,
              fileName: fileName,
              restPath: pathParts.join('/'),
            }
          } else {
            return null
          }
        })
        .filter((l) => l)
      return cleanLines as {
        action: 'M' | 'A' | 'D' | '??'
        path: string
        restPath: string
        fileName: string
      }[]
    } else {
      return null
    }
  })

  const actionMap = {
    M: 'modified',
    A: 'added',
    D: 'deleted',
    '??': 'untracked',
  }

  const actionColor = {
    M: 'text-yellow-500',
    A: 'text-green-500',
    D: 'text-red-500',
    '??': 'text-gray-200',
  }

  $inspect(parsedChanges)
</script>

<div class="flex flex-col space-y-3">
  {#if status[0] === 'git-full'}
    <div class="flexcs space-x-3">
      <button
        onclick={() => openOnFileExplorer(null)}
        aria-label="Open filesystem"
        class="w6 h6 flexcc text-white hover:text-lime-400 p1"
      >
        <FolderIcon />
      </button>
      <GitRemoteDisplay class="flex-grow" url={status[1]} />
    </div>
    <FetchNSync {repo} {onFetch} {onSync} />
  {/if}
  {#if parsedChanges}
    <div class="bg-black/20 rounded-1 shadow-[inset_0_0_0_1px_#0002]">
      <div class="text-white lh-6 text-3 font-mono px3"
        >Local changes detected</div
      >
      <div
        class="w-full max-h-200px font-mono overflow-auto text-2.5 p3 b b-black/40 shadow-[inset_0_0_1px_2px_#0002] bg-gray-700 text-white"
      >
        {#each parsedChanges as { action, path, restPath, fileName } (path)}
          <div class="flexcc">
            <div class="flexcs w-full overflow-hidden" title={path}>
              <span>{fileName}</span>
              <span class="text-2 ml1 opacity-50">{restPath}</span>
            </div>

            <div
              class={['w-5 flexcc flex-shrink-0', actionColor[action]]}
              title={actionMap[action]}>{action}</div
            >
          </div>
        {/each}
      </div>
      <div class="p3">
        <UncommittedChangesLogger
          changeView={false}
          onConfirm={(msg) => {
            onCommit(msg)
          }}
          changes={repo.uncommittedChanges}
        />
      </div>
    </div>
  {/if}
</div>
