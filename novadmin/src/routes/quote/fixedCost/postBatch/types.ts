import { QuoteFixedCost } from '@novadmin/lib/types'

export type QuoteFixedCostBatchPostBody = {
    records: QuoteFixedCost[]
}

export type QuoteFixedCostBatchPostParams = QuoteFixedCostBatchPostBody & {}

export type QuoteFixedCostBatchPostResponse =
    | {
          meta: QuoteFixedCostBatchPostParams
          data: QuoteFixedCost[]
      }
    | {
          error: string
          details?: any
      }
