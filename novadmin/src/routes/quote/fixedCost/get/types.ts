import { QuoteFixedCostFuzzyFields, OrderOptions } from 'data/quoteFixedCost'
import { QuoteFixedCost, QuoteFixedCostValueType } from '@novadmin/lib/types'
import { ActivationStatusFilter, StringList } from '@novadmin/lib/types'

export type QuoteFixedCostGetRequest = {
    id?: string
    valueTypes?: StringList<QuoteFixedCostValueType>
    generalFuzzyValue?: string
    generalFuzzyFields?: StringList<QuoteFixedCostFuzzyFields>
    order?: OrderOptions
    activationStatus?: ActivationStatusFilter
    page?: number
    limit?: number
}

export type QuoteFixedCostGetParams = {
    id?: string
    valueTypes?: QuoteFixedCostValueType[]
    generalFuzzy: {
        value?: string
        fields?: QuoteFixedCostFuzzyFields[]
    }
    order: OrderOptions
    activationStatus: ActivationStatusFilter
    page: number
    limit: number
}

export type QuoteFixedCostGetResponse =
    | {
          meta: QuoteFixedCostGetParams
          count: {
              total: number
              page: number
          }
          data: QuoteFixedCost[]
      }
    | {
          error: string
      }
