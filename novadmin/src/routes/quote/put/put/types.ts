import { UpdateGeneralQuoteRecord } from 'data/quote'
import { Quote } from '@novadmin/lib/types'

export type QuotePutBody = {
    record: UpdateGeneralQuoteRecord
}

export type QuotePutParams = QuotePutBody & {}

export type QuotePutResponse =
    | {
          meta: QuotePutParams
          data: Quote[]
      }
    | {
          error: string
          details?: any
      }
