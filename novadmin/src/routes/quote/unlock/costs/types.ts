import { LockInformation } from '@novadmin/lib/types'

export type QuoteCostsUnlockPostBody = {
    id: number
}

export type QuoteCostsUnlockPostParams = QuoteCostsUnlockPostBody & {}

export type QuoteCostsUnlockPostResponse =
    | {
          meta: QuoteCostsUnlockPostParams
          data: LockInformation
      }
    | {
          error: string
          details?: any
      }
