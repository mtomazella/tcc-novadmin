import { MaterialFuzzyFields, OrderOptions } from 'data/material'
import { Material, MaterialType } from '@novadmin/lib/types'
import { ActivationStatusFilter, StringList } from '@novadmin/lib/types'

export type MaterialGetRequest = {
    id?: number
    supplierId?: number
    type?: MaterialType
    includeSupplier?: boolean
    generalFuzzyValue?: string
    generalFuzzyFields?: StringList<MaterialFuzzyFields>
    order?: OrderOptions
    activationStatus?: ActivationStatusFilter
    page?: number
    limit?: number
}

export type MaterialGetParams = {
    id?: number
    supplierId?: number
    type?: MaterialType
    includeSupplier: boolean
    generalFuzzy: {
        value?: string
        fields?: MaterialFuzzyFields[]
    }
    order: OrderOptions
    activationStatus: ActivationStatusFilter
    page: number
    limit: number
}

export type MaterialGetResponse =
    | {
          meta: MaterialGetParams
          count: {
              total: number
              page: number
          }
          data: Material[]
      }
    | {
          error: string
      }
