import { OrderOptions } from 'data/obra'
import {
    IncludeDatabaseDates,
    Obra,
    IncludeClientOptional,
} from '@novadmin/lib/types'
import { StringList } from '@novadmin/lib/types'

export type GeneralFuzzyField =
    | 'name'
    | 'description'
    | 'phone'
    | 'email'
    | 'address'
    | 'addressComplement'
    | 'contact'

export type ObraGetRequest = {
    id?: number
    fuzzyName?: string
    fuzzyDescription?: string
    fuzzyPhone?: string
    fuzzyEmail?: string
    fuzzyAddress?: string
    fuzzyAddressComplement?: string
    fuzzyContact?: string
    generalFuzzyValue?: string
    generalFuzzyFields?: StringList<GeneralFuzzyField>
    order?: OrderOptions
    includeDeleted?: string
    includeClient?: string
    page?: number
    limit?: number
}

export type ObraGetParams = {
    id?: number
    generalFuzzy: {
        value?: string
        fields?: GeneralFuzzyField[]
    }
    fuzzy: {
        name?: string
        description?: string
        phone?: string
        email?: string
        address?: string
        addressComplement?: string
        contact?: string
    }
    order: OrderOptions
    includeDeleted: boolean
    includeClient: boolean
    page: number
    limit: number
}

export type ObraGetResponse =
    | {
          meta: ObraGetParams
          count: {
              total: number
              page: number
          }
          data: IncludeClientOptional<IncludeDatabaseDates<Obra>>[]
      }
    | {
          error: string
      }
