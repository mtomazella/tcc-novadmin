import { QuoteElementFuzzyFields, OrderOptions } from 'data/quoteElement'
import { QuoteElement, QuoteElementType } from '@novadmin/lib/types'
import { ActivationStatusFilter, StringList } from '@novadmin/lib/types'

export type QuoteElementGetRequest = {
    id?: number
    quoteId?: number
    scopeId?: number
    productId?: number
    type?: string
    generalFuzzyValue?: string
    generalFuzzyFields?: StringList<QuoteElementFuzzyFields>
    includeProductName?: string
    includeProduct?: string
    includeScope?: string
    activationStatus?: string
    order?: string
    page?: number
    limit?: number
}

export type QuoteElementGetParams = {
    id?: number
    quoteId?: number
    scopeId?: number
    productId?: number
    type?: QuoteElementType
    generalFuzzy: {
        value?: string
        fields?: QuoteElementFuzzyFields[]
    }
    includeProductName: boolean
    includeProduct: boolean
    includeScope: boolean
    order: OrderOptions
    activationStatus: ActivationStatusFilter
    page: number
    limit: number
}

export type QuoteElementGetResponse =
    | {
          meta: QuoteElementGetParams
          count: {
              total: number
              page: number
          }
          data: QuoteElement[]
      }
    | {
          error: string
      }
