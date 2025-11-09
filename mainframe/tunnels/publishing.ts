// @tunneled

import chalk from 'chalk'
import { $path } from '@/center/utils/system'
import {
  forcePushToOriginOnWwwBranch,
  remoteUrl,
} from '../servers/git-server/git'

export async function publishRepo(repo: string) {
  const origin = await remoteUrl($path(`repos/${repo}`))
  if (origin) {
    try {
      return await forcePushToOriginOnWwwBranch(
        $path(`projections/${repo}`),
        origin,
      )
    } catch (e) {
      return { success: false, error: 'Uncaugh error, check raw log' }
    }
  }
  return { success: true }
}
