import { OrderOptions } from 'data/product'
import { IncludeDatabaseDates, Product } from '@novadmin/lib/types'
import { StringList } from '@novadmin/lib/types'

export type GeneralFuzzyField = 'name' | 'description' | 'shorthand'

export type ProductGetRequest = {
    id?: string
    fuzzyName?: string
    fuzzyDescription?: string
    fuzzyShorthand?: string
    generalFuzzyValue?: string
    generalFuzzyFields?: StringList<GeneralFuzzyField>
    order?: OrderOptions
    includeDeleted?: string
    page?: number
    limit?: number
}

export type ProductGetParams = {
    id?: number
    generalFuzzy: {
        value?: string
        fields?: GeneralFuzzyField[]
    }
    fuzzy: {
        name?: string
        description?: string
        shorthand?: string
    }
    order: OrderOptions
    includeDeleted: boolean
    page: number
    limit: number
}

export type ProductGetResponse =
    | {
          meta: ProductGetParams
          count: {
              total: number
              page: number
          }
          data: IncludeDatabaseDates<Product>[]
      }
    | {
          error: string
      }
