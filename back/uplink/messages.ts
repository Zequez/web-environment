export type Repo = {
  name: string | null
  status:
    | ['unknown']
    | ['invalid']
    | ['dir']
    | ['git']
    | ['git-full', remote: string, sync: SyncStatus]
  mergeConflicts: boolean
}

export type SyncStatus = 'ahead' | 'behind' | 'diverged' | 'in-sync' | 'unknown'

export type BackMsg = ['repos-list', repos: Repo[]]

export type FrontMsg =
  | ['add-repo', name: string]
  | ['init-repo-git', name: string]
  | ['remove-repo', name: string]
  | ['add-remote', name: string, remote: string]
  | ['sync', name: string | null]
