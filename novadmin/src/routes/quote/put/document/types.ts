import { UpdateQuoteDocumentRecord } from 'data/quote'
import { Quote } from '@novadmin/lib/types'

export type QuoteDocumentPutBody = {
    record: UpdateQuoteDocumentRecord
}

export type QuoteDocumentPutParams = QuoteDocumentPutBody & {}

export type QuoteDocumentPutResponse =
    | {
          meta: QuoteDocumentPutParams
          data: Quote[]
      }
    | {
          error: string
          details?: any
      }
