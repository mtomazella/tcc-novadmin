import { QuoteElement } from '@novadmin/lib/types'

export type QuoteElementPostBody = {
    record: QuoteElement
}

export type QuoteElementPostParams = QuoteElementPostBody & {}

export type QuoteElementPostResponse =
    | {
          meta: QuoteElementPostParams
          data: QuoteElement[]
      }
    | {
          error: string
          details?: any
      }
