import { LockInformation } from '@novadmin/lib/types'

export type QuoteDocumentUnlockPostBody = {
    id: number
}

export type QuoteDocumentUnlockPostParams = QuoteDocumentUnlockPostBody & {}

export type QuoteDocumentUnlockPostResponse =
    | {
          meta: QuoteDocumentUnlockPostParams
          data: LockInformation
      }
    | {
          error: string
          details?: any
      }
