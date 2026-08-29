import { IncludeDatabaseDates, QuoteFile } from '@novadmin/lib/types'
import { ActivationStatusFilter } from '@novadmin/lib/types'

export type QuoteFileGetRequest = {
    id?: number
    quoteId?: number
    activationStatus?: string
    order?: string
    page?: number
    limit?: number
    includeContent?: boolean
}

export type QuoteFileGetParams = {
    id?: number
    quoteId?: number
    activationStatus: ActivationStatusFilter
    order?: string
    page: number
    limit: number
    includeContent: boolean
}

export type QuoteFileGetResponse =
    | {
          meta: QuoteFileGetParams
          count: {
              total: number
              page: number
          }
          data: IncludeDatabaseDates<QuoteFile>[]
      }
    | {
          error: string
      }
