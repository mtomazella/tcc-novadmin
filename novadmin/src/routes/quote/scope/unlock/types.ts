import { LockInformation } from '@novadmin/lib/types'

export type QuoteScopeUnlockPostBody = {
    id: number
}

export type QuoteScopeUnlockPostParams = QuoteScopeUnlockPostBody & {}

export type QuoteScopeUnlockPostResponse =
    | {
          meta: QuoteScopeUnlockPostParams
          data: LockInformation
      }
    | {
          error: string
          details?: any
      }
