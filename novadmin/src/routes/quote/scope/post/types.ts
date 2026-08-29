import { QuoteScope } from '@novadmin/lib/types'

export type QuoteScopePostBody = {
    record: QuoteScope
}

export type QuoteScopePostParams = QuoteScopePostBody & {}

export type QuoteScopePostResponse =
    | {
          meta: QuoteScopePostParams
          data: QuoteScope[]
      }
    | {
          error: string
          details?: any
      }
