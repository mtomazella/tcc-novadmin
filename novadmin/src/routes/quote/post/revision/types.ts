import { CreateQuoteVersionRecord } from 'data/quote'
import { Quote } from '@novadmin/lib/types'

export type QuoteRevisionPostBody = {} & CreateQuoteVersionRecord

export type QuoteRevisionPostParams = QuoteRevisionPostBody & {}

export type QuoteRevisionPostResponse =
    | {
          meta: QuoteRevisionPostParams
          data: Quote[]
      }
    | {
          error: string
          details?: any
      }
