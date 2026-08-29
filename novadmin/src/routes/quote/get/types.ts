import { QuoteFuzzyField, OrderOptions, RootStatus } from 'data/quote'
import { Quote, QuoteVersionType } from '@novadmin/lib/types'
import { ActivationStatusFilter, StringList } from '@novadmin/lib/types'

export type QuoteGetRequest = {
    id?: number
    parentId?: number
    rootId?: number
    versionType?: string
    clientId?: number
    obraId?: number
    createdByUserId?: number
    quoteNumber?: string
    revisionNumber?: number
    additionNumber?: number
    yearCode?: number
    rootStatus?: string
    generalFuzzyValue?: string
    generalFuzzyFields?: StringList<QuoteFuzzyField>
    includeVersionSummary?: boolean
    includeClient?: boolean
    includeObra?: boolean
    activationStatus?: string
    order?: string
    page?: number
    limit?: number
}

export type QuoteGetParams = {
    id?: number
    parentId?: number
    rootId?: number
    versionType?: QuoteVersionType
    clientId?: number
    obraId?: number
    createdByUserId?: number
    quoteNumber?: string
    revisionNumber?: number
    additionNumber?: number
    yearCode?: number
    rootStatus?: RootStatus
    generalFuzzy: {
        value?: string
        fields?: QuoteFuzzyField[]
    }
    includeVersionSummary?: boolean
    includeClient?: boolean
    includeObra?: boolean
    activationStatus: ActivationStatusFilter
    order: OrderOptions
    page: number
    limit: number
}

export type QuoteGetResponse =
    | {
          meta: QuoteGetParams
          count: {
              total: number
              page: number
          }
          data: Quote[]
      }
    | {
          error: string
      }
