import { CreateQuoteVersionRecord } from 'data/quote'
import { Quote } from '@novadmin/lib/types'

export type QuoteAdditionPostBody = {} & CreateQuoteVersionRecord

export type QuoteAdditionPostParams = QuoteAdditionPostBody & {}

export type QuoteAdditionPostResponse =
    | {
          meta: QuoteAdditionPostParams
          data: Quote[]
      }
    | {
          error: string
          details?: any
      }
