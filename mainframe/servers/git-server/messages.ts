import type { WEnvConfig } from '@/center/wenv-config'

export type Repo = {
  name: string | null
  status: ['unknown'] | ['git'] | ['git-full', remote: string, sync: SyncStatus]
  mergeConflicts: boolean
  fetching: boolean
  syncing: boolean
  lastFetchedAt: number
  uncommittedChanges: string
  wenv?: WEnvConfig
}

export type SyncStatus = 'ahead' | 'behind' | 'diverged' | 'in-sync' | 'unknown'

export type BackMsg = ['repos-list', repos: Repo[]]

export type FrontMsg =
  | ['add-repo', name: string]
  | ['init-repo-git', name: string]
  | ['remove-repo', name: string]
  | ['duplicate-repo', name: string]
  | ['remove-remote', name: string]
  | ['rename-repo', name: string, newName: string]
  | ['add-remote', name: string, remote: string]
  | ['commit', name: string | null, message: string]
  | ['sync', name: string | null]
  | ['fetch', name: string | null]
  | ['fetch-all']
  | ['analyze-all']
