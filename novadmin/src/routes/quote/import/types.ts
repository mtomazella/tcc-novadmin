import { QuoteScope, QuoteElement } from '@novadmin/lib/types'
import {
    QuoteImportElementRecord,
    QuoteImportParams,
    QuoteImportScopeRecord,
} from 'data/quote/import'

export type QuoteImportPostBody = {
    quoteId: number
    scopes: QuoteImportScopeRecord[]
    elements: QuoteImportElementRecord[]
}

export type QuoteImportPostParams = QuoteImportParams

export type QuoteImportPostResponse =
    | {
          meta: QuoteImportPostParams
          data: { scopes: QuoteScope[]; elements: QuoteElement[] }
      }
    | {
          error: string
          details?: any
      }
