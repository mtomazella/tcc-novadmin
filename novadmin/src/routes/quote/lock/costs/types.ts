import { LockInformation } from '@novadmin/lib/types'

export type QuoteDocumentLockPostBody = {
    id: number
}

export type QuoteDocumentLockPostParams = QuoteDocumentLockPostBody & {}

export type QuoteDocumentLockPostResponse =
    | {
          meta: QuoteDocumentLockPostParams
          data: LockInformation
      }
    | {
          error: string
          details?: any
      }
