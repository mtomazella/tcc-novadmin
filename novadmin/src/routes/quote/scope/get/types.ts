import { QuoteScopeFuzzyField, OrderOptions } from 'data/quoteScope'
import { QuoteScope } from '@novadmin/lib/types'
import { ActivationStatusFilter, StringList } from '@novadmin/lib/types'

export type QuoteScopeGetRequest = {
    id?: number
    quoteId?: number
    generalFuzzyValue?: string
    generalFuzzyFields?: StringList<QuoteScopeFuzzyField>
    includeProductName?: string
    activationStatus?: string
    order?: string
    page?: number
    limit?: number
}

export type QuoteScopeGetParams = {
    id?: number
    quoteId?: number
    generalFuzzy: {
        value?: string
        fields?: QuoteScopeFuzzyField[]
    }
    activationStatus: ActivationStatusFilter
    order: OrderOptions
    page: number
    limit: number
}

export type QuoteScopeGetResponse =
    | {
          meta: QuoteScopeGetParams
          count: {
              total: number
              page: number
          }
          data: QuoteScope[]
      }
    | {
          error: string
      }
