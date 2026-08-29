import { CreateQuoteRecord } from 'data/quote'
import { Quote } from '@novadmin/lib/types'

export type QuotePostBody = {} & CreateQuoteRecord

export type QuotePostParams = QuotePostBody & {}

export type QuotePostResponse =
    | {
          meta: QuotePostParams
          data: Quote[]
      }
    | {
          error: string
          details?: any
      }
