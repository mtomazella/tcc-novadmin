import { SupplierFuzzyFields, OrderOptions } from 'data/supplier'
import { Supplier } from '@novadmin/lib/types'
import { ActivationStatusFilter, StringList } from '@novadmin/lib/types'

export type SupplierGetRequest = {
    id?: number
    materialId?: number
    materialSkus?: StringList<string>
    includeMaterials?: boolean
    generalFuzzyValue?: string
    generalFuzzyFields?: StringList<SupplierFuzzyFields>
    order?: OrderOptions
    activationStatus?: ActivationStatusFilter
    materialActivationStatus?: ActivationStatusFilter
    page?: number
    limit?: number
}

export type SupplierGetParams = {
    id?: number
    materialId?: number
    materialSkus?: string[]
    includeMaterials: boolean
    generalFuzzy: {
        value?: string
        fields?: SupplierFuzzyFields[]
    }
    order: OrderOptions
    activationStatus: ActivationStatusFilter
    materialActivationStatus: ActivationStatusFilter
    page: number
    limit: number
}

export type SupplierGetResponse =
    | {
          meta: SupplierGetParams
          count: {
              total: number
              page: number
          }
          data: Supplier[]
      }
    | {
          error: string
      }
