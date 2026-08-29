import { LockInformation } from '@novadmin/lib/types'

export type QuoteScopeLockPostBody = {
    id: number
}

export type QuoteScopeLockPostParams = QuoteScopeLockPostBody & {}

export type QuoteScopeLockPostResponse =
    | {
          meta: QuoteScopeLockPostParams
          data: LockInformation
      }
    | {
          error: string
          details?: any
      }
