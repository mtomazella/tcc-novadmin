import { QuoteFixedCost } from '@novadmin/lib/types'

export type QuoteFixedCostPostBody = {
    record: QuoteFixedCost
}

export type QuoteFixedCostPostParams = QuoteFixedCostPostBody & {}

export type QuoteFixedCostPostResponse =
    | {
          meta: QuoteFixedCostPostParams
          data: QuoteFixedCost[]
      }
    | {
          error: string
          details?: any
      }
