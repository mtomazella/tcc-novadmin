import { OrderOptions } from 'data/client'
import { Client } from '@novadmin/lib/types'
import { StringList } from '@novadmin/lib/types'

export type GeneralFuzzyField =
    | 'name'
    | 'address'
    | 'city'
    | 'state'
    | 'zipCode'
    | 'phone'

export type ClientGetRequest = {
    id?: number
    fuzzyName?: string
    fuzzyAddress?: string
    fuzzyCity?: string
    fuzzyState?: string
    fuzzyZipCode?: string
    fuzzyPhone?: string
    generalFuzzyValue?: string
    generalFuzzyFields?: StringList<GeneralFuzzyField>
    order?: OrderOptions
    includeDeleted?: string
    page?: number
    limit?: number
}

export type ClientGetParams = {
    id?: number
    generalFuzzy: {
        value?: string
        fields?: GeneralFuzzyField[]
    }
    fuzzy: {
        name?: string
        address?: string
        city?: string
        state?: string
        zipCode?: string
        phone?: string
    }
    order: OrderOptions
    includeDeleted: boolean
    page: number
    limit: number
}

export type ClientGetResponse =
    | {
          meta: ClientGetParams
          count: {
              total: number
              page: number
          }
          data: Client[]
      }
    | {
          error: string
      }
