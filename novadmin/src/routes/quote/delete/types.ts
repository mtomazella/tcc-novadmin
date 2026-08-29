import { QuoteScope } from '@novadmin/lib/types'

export type QuoteDeleteRequest = {
    id: number
}

export type QuoteDeleteParams = QuoteDeleteRequest & {}

export type QuoteDeleteResponse =
    | {
          meta: QuoteDeleteParams
          data: QuoteScope[]
      }
    | {
          error: string
          details?: any
      }
