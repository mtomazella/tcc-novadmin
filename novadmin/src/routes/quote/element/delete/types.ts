import { QuoteElement } from '@novadmin/lib/types'

export type QuoteElementDeleteRequest = {
    id: number
}

export type QuoteElementDeleteParams = QuoteElementDeleteRequest & {}

export type QuoteElementDeleteResponse =
    | {
          meta: QuoteElementDeleteParams
          data: QuoteElement[]
      }
    | {
          error: string
          details?: any
      }
