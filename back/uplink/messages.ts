export type Repo = {
  name: string | null
  status: ['dir'] | ['git'] | ['git-full', remote: string]
}

export type BackMsg = ['repos-list', repos: Repo[]]
