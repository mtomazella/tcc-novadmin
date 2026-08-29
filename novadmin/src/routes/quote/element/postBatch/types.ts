import { QuoteElement } from '@novadmin/lib/types'

export type QuoteElementBatchPostBody = {
    records: QuoteElement[]
}

export type QuoteElementBatchPostParams = QuoteElementBatchPostBody & {}

export type QuoteElementBatchPostResponse =
    | {
          meta: QuoteElementBatchPostParams
          data: QuoteElement[]
      }
    | {
          error: string
          details?: any
      }
