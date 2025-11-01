<script lang="ts">
  import GithubIcon from '~icons/fa6-brands/github'
  import CodeBranchIcon from '~icons/fa6-solid/code-branch'
  import ArrowDownIcon from '~icons/fa6-solid/arrow-down'
  import RefreshIcon from '~icons/fa6-solid/arrow-rotate-right'
  import { lsState } from '@/center/utils/runes.svelte'

  let changeLogOpen = lsState('change-log-open', { v: false })

  type Change = {
    date: Date
    message: string
    commitHash: string
    upstream: boolean
  }
  let changeLog: Change[] = [
    {
      date: new Date('2023-01-01 6:00:00'),
      message: 'Initial commit',
      commitHash: '0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a',
      upstream: false,
    },
    {
      date: new Date('2024-01-01 14:00:00'),
      message: 'Better repos UI',
      commitHash: '5ff03e0ce078c8faa214f211be73d482b0913b7d',
      upstream: false,
    },
    {
      date: new Date('2024-01-01 12:00:00'),
      message:
        'Started some stuff with using the Canvas substrate on the repos browser; I improved upon the Canvas substrate.',
      commitHash: '6a2885e9c7e866f1532eabbe15bce3885291fb5f',
      upstream: false,
    },
    {
      date: new Date('2024-01-01 14:00:00'),
      message: 'Better repos UI',
      commitHash: '5ff03e0ce078c8faa214f211be73d482b0913b7d',
      upstream: false,
    },
    {
      date: new Date('2024-01-01 12:00:00'),
      message:
        'Started some stuff with using the Canvas substrate on the repos browser; I improved upon the Canvas substrate.',
      commitHash: '6a2885e9c7e866f1532eabbe15bce3885291fb5f',
      upstream: false,
    },
    {
      date: new Date('2025-06-01 14:00:00'),
      message: 'Better repos UI',
      commitHash: '5ff03e0ce078c8faa214f211be73d482b0913b7d',
      upstream: true,
    },
    {
      date: new Date('2025-06-01 12:00:00'),
      message:
        'Started some stuff with using the Canvas substrate on the repos browser; I improved upon the Canvas substrate.',
      commitHash: '6a2885e9c7e866f1532eabbe15bce3885291fb5f',
      upstream: true,
    },
  ]

  let changeLogSorted = changeLog.sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  )

  let grouped = changeLogSorted.reduce(
    (acc, change) => {
      let date = change.date.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(change)
      return acc
    },
    {} as Record<string, Change[]>,
  )

  let upstreamChangesCount = changeLog.filter((c) => c.upstream).length
</script>

<div
  class="absolute top-0 left-1/2 space-y-3 font-mono -translate-x-1/2 p3 pb-1.5 rounded-b-2 bg-gray-200 b b-black/10 b-t-0 shadow-[0_0_3px_1px_#0002] z-9999"
>
  <a
    href="https://github.com/zequez/web-environment"
    target="_blank"
    class="flexcs whitespace-nowrap font-mono text-3"
  >
    <GithubIcon class="text-3 mr1 flex-shrink-0" /> zequez/web-environment
  </a>
  <div class="flexcs text-3">
    <button
      on:click={() => (changeLogOpen.v = !changeLogOpen.v)}
      class={[
        'flexcc bg-blue-400 bg-gradient-to-b relative  group -left-1px py1  text-white mr2 px1.5 rounded-1 -ml3 rounded-l-0',
        {
          ' shadow-[inset_0_0_4px_1px_#0005,inset_0_0_0.5px_1px_#0006] from-black/10 to-black/0':
            changeLogOpen.v,
          'shadow-[inset_0_0_0_1px_#0003] hover:brightness-110 from-white/10 to-white/0 ':
            !changeLogOpen.v,
        },
      ]}
    >
      <div class={['flexcc', { 'translate-y-1px': changeLogOpen.v }]}>
        <span
          class="flexcc w5 h5 b mr1 b-white/20 bg-green-500 text-white rounded-full"
          ><ArrowDownIcon class="text-2" /> 3</span
        > <span class="text-shadow-[0_1px_0_#0006]">CHANGELOG</span>
      </div>
    </button>
    <div class="flexcs flex-grow"
      ><CodeBranchIcon class="text-3 mr1" /> main</div
    >
    <button class="group hover:(bg-black/10) p.5 rounded-1 transition-transform"
      ><RefreshIcon
        class="text-3 group-hover:rotate-45deg transition-transform"
      /></button
    >
  </div>
  <!-- <div>
    <button
      class="flexcc w-full bg-green-500 hover:brightness-110 b b-black/10 rounded-1 text-white"
      ><ArrowDownIcon class="text-3" /> 3 updates</button
    >
    <button>Change log</button>
  </div> -->
  {#if changeLogOpen.v}
    <div
      class="absolute right-full pr1 -top-3 font-mono shadow-[0_0_3px_1px_#0002]"
    >
      <div class="bg-gray-200 w-300px rounded-b-2 b b-black/10">
        <div class="text-center mb1.5">CHANGELOG</div>
        {#if upstreamChangesCount}
          <div class="px-3">
            <button
              class="bg-green-500 hover:brightness-110 text-white w-full rounded-1 b b-black/10 mb3"
              >Apply {upstreamChangesCount} changes</button
            >
          </div>
        {/if}
        <div class="px3 text-3">
          {#each Object.entries(grouped) as [date, changes]}
            {@const dateObj = new Date(date)}
            <div class="text-3 underline">{dateObj.toDateString()}</div>
            <div class="pl2 pb3">
              {#each changes as log}
                <div
                  ><span
                    class={[
                      '',
                      {
                        'opacity-100 text-white bg-green-500 px1 rounded-1 shadow-[inset_0_0_0_1px_#0001]':
                          log.upstream,
                        'opacity-50': !log.upstream,
                      },
                    ]}>{log.commitHash.slice(0, 6)}</span
                  >
                  {log.message}</div
                >
              {/each}
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
