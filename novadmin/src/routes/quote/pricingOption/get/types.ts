import {
    QuotePricingOptionFuzzyFields,
    OrderOptions,
} from 'data/quotePricingOption'
import { QuotePricingOption } from '@novadmin/lib/types'
import { ActivationStatusFilter, StringList } from '@novadmin/lib/types'

export type QuotePricingOptionGetRequest = {
    id?: string
    generalFuzzyValue?: string
    generalFuzzyFields?: StringList<QuotePricingOptionFuzzyFields>
    order?: OrderOptions
    activationStatus?: ActivationStatusFilter
    page?: number
    limit?: number
}

export type QuotePricingOptionGetParams = {
    id?: string
    generalFuzzy: {
        value?: string
        fields?: QuotePricingOptionFuzzyFields[]
    }
    order: OrderOptions
    activationStatus: ActivationStatusFilter
    page: number
    limit: number
}

export type QuotePricingOptionGetResponse =
    | {
          meta: QuotePricingOptionGetParams
          count: {
              total: number
              page: number
          }
          data: QuotePricingOption[]
      }
    | {
          error: string
      }
