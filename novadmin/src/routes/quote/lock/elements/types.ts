import { LockInformation } from '@novadmin/lib/types'

export type QuoteElementsLockPostBody = {
    id: number
}

export type QuoteElementsLockPostParams = QuoteElementsLockPostBody & {}

export type QuoteElementsLockPostResponse =
    | {
          meta: QuoteElementsLockPostParams
          data: LockInformation
      }
    | {
          error: string
          details?: any
      }
