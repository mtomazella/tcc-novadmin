import { QuoteFile } from '@novadmin/lib/types'
import { UpsertQuoteFileRecord } from 'data/quoteFile'

export type QuoteFilePostBody = {
    record: UpsertQuoteFileRecord
}

export type QuoteFilePostParams = QuoteFilePostBody & {}

export type QuoteFilePostResponse =
    | {
          meta: QuoteFilePostParams
          data: QuoteFile[]
      }
    | {
          error: string
          details?: any
      }
