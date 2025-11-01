<script lang="ts">
  import CodeBranchIcon from '~icons/fa6-solid/code-branch'
  import ArrowUpIcon from '~icons/fa6-solid/arrow-up'
  import ArrowDownIcon from '~icons/fa6-solid/arrow-down'
  import ReloadIcon from '~icons/fa6-solid/rotate'
  import GithubIcon from '~icons/fa6-brands/github'
  import CloudIcon from '~icons/fa6-solid/cloud-arrow-up'
  import CaretDownIcon from '~icons/fa6-solid/caret-down'
  import CheckIcon from '~icons/fa6-solid/check'
  import RefreshIcon from '~icons/fa6-solid/arrow-rotate-right'
  import { lsState } from '@/center/utils/runes.svelte'

  const props: { repo: RepoState } = $props()

  export type RepoState =
    | {
        name: string
        mode: 'no-git'
      }
    | {
        name: string
        mode: 'local-only-git'
        branch: string
        uncommittedChanges: FileChange[]
      }
    | {
        name: string
        mode: 'remote-git'
        url: string
        branch: string
        remoteAhead: number
        localAhead: number
        uncommittedChanges: FileChange[]
      }

  type FileChange = {
    filePath: string
    action: 'm' | 'd' | 'u'
  }

  let btnClass =
    'flexcc b b-black/10 bg-blue-400 hover:brightness-110 text-white p1.5 w-full rounded-1'

  let changesExpanded = lsState(`repo-change-expanded-${props.repo.name}`, {
    v: false,
  })

  function extractRepo(url: string): [host: 'github' | string, path: string] {
    const noHttp = url.replace('https://', '').replace('http://', '')
    const parts = noHttp.split('/')
    const host = parts[0] === 'github.com' ? 'github' : parts[0]
    return [host, parts.slice(1).join('/').replace(/.git$/, '')]
  }
</script>

{#snippet change(fileName: string, action: 'm' | 'd' | 'u')}
  <div class="flexcs">
    <div
      class={[
        'flex-grow',
        {
          'line-through': action === 'd',
        },
      ]}>{fileName}</div
    >
    <div
      class={[
        'uppercase w-4 text-center font-bold',
        {
          'text-yellow-500': action === 'm',
          'text-red-500': action === 'd',
          'text-green-500': action === 'u',
        },
      ]}>{action}</div
    >
  </div>
{/snippet}

<div class="bg-gray-200 rounded-1 b b-black/10 p1.5 flex flex-col space-y-1.5">
  {#if props.repo.mode === 'no-git'}
    <button class={btnClass}>
      <CodeBranchIcon class="mr1.5 text-3" /> Initialize Change Tracking
    </button>
  {:else}
    <div class="flexcs uppercase text-3 font-semibold">
      <div class="flex-grow">Change Tracking</div>
      <div class="flexcs normal-case">
        <CodeBranchIcon class="mr1.5 text-3" />
        {props.repo.branch}
      </div>
    </div>
    <!-- LOCAL-ONLY GIT -->
    {#if props.repo.mode === 'local-only-git'}
      <button class={btnClass}>
        <CloudIcon class="mr1ch text-3" /> Setup remote sync
      </button>
      <!-- REMOTE GIT -->
    {:else if props.repo.mode === 'remote-git'}
      {@const [host, path] = extractRepo(props.repo.url)}
      <div class="flexcs">
        <a
          target="_blank"
          href={props.repo.url}
          class="flexcs flex-grow w-1 overflow-hidden"
        >
          {#if host === 'github'}
            <GithubIcon class="mr1 text-3 flex-shrink-0" />
          {:else}
            {host}
          {/if}
          {path}
        </a>
        <button class="flexcc bg-black/10 rounded-l-1 group ml1">
          <span class="inline-flex items-center px1 text-3">
            {props.repo.localAhead}
            <ArrowUpIcon class="ml1 text-2" />
          </span>
          <span class="inline-flex items-center px1 text-3">
            {props.repo.remoteAhead}
            <ArrowDownIcon class="ml1 text-2" />
          </span>
          <span
            class="bg-blue-400 shadow-[inset_0_0_0_1px_#0002] text-white group-hover:(filter-brightness-120) p1 rounded-1 text-3"
          >
            <RefreshIcon class="text-2" />
          </span>
        </button>
      </div>
      {#if props.repo.localAhead || props.repo.remoteAhead}
        <button class={btnClass}>
          <ReloadIcon class="mr1ch text-3" /> Sync Changes
          {#if props.repo.localAhead}
            <span
              class="inline-flex ml1ch items-center bg-black/10 px1.5 rounded-1"
              >3 <ArrowUpIcon class="ml1.5 text-3" /></span
            >
          {/if}
          {#if props.repo.remoteAhead}
            <span
              class="inline-flex ml1ch items-center bg-black/10 px1.5 rounded-1"
              >6 <ArrowDownIcon class="ml1.5 text-3" /></span
            >
          {/if}
        </button>
      {:else}
        <div class="bg-gray-300 flexcc p1.5 rounded-1 b b-black/5 text-black/40"
          >Up to date</div
        >
      {/if}
    {/if}

    <!-- UNCOMMITTED CHANGES -->
    {#if (props.repo.mode === 'local-only-git' || props.repo.mode === 'remote-git') && props.repo.uncommittedChanges.length}
      <input
        class="w-full mb1.5 px1.5 h6 rounded-1 outline-blue-400"
        placeholder="Message"
      />
      <button class={btnClass}>
        <CheckIcon class="mr1ch text-3" /> Log Changes
      </button>

      <button
        class="flexcs mt1.5 text-3"
        onclick={() => {
          changesExpanded.v = !changesExpanded.v
        }}
      >
        <CaretDownIcon
          class={[
            'mr1ch relative -mt2px',
            {
              '-rotate-90': !changesExpanded.v,
            },
          ]}
        /> Local Changes ({props.repo.uncommittedChanges.length})</button
      >

      {#if changesExpanded.v}
        <div class="pl1.5 text-3">
          {#each props.repo.uncommittedChanges as { filePath, action }}
            {@render change(filePath, action)}
          {/each}
        </div>
      {/if}
    {/if}
  {/if}
</div>
