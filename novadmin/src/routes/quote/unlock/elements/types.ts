import { LockInformation } from '@novadmin/lib/types'

export type QuoteElementsUnlockPostBody = {
    id: number
}

export type QuoteElementsUnlockPostParams = QuoteElementsUnlockPostBody & {}

export type QuoteElementsUnlockPostResponse =
    | {
          meta: QuoteElementsUnlockPostParams
          data: LockInformation
      }
    | {
          error: string
          details?: any
      }
