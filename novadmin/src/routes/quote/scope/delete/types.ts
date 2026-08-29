import { QuoteScope } from '@novadmin/lib/types'

export type QuoteScopeDeleteRequest = {
    id: number
}

export type QuoteScopeDeleteParams = QuoteScopeDeleteRequest & {}

export type QuoteScopeDeleteResponse =
    | {
          meta: QuoteScopeDeleteParams
          data: QuoteScope[]
      }
    | {
          error: string
          details?: any
      }
