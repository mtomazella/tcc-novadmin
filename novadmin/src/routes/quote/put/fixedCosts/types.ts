import { UpdateQuoteCostsRecord } from 'data/quote'
import { Quote } from '@novadmin/lib/types'

export type QuoteFixedCostsPutBody = {
    record: UpdateQuoteCostsRecord
}

export type QuoteFixedCostsPutParams = QuoteFixedCostsPutBody & {}

export type QuoteFixedCostsPutResponse =
    | {
          meta: QuoteFixedCostsPutParams
          data: Quote[]
      }
    | {
          error: string
          details?: any
      }
