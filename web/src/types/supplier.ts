import type { Material, Supplier } from '@novadmin/lib/types'

export type { Material, Supplier }

export type EditingMaterial = {
  id?: number
  sku: string
  name: string
  description: string
  type: string
  value: number | ''
}

export type SupplierParams = {
  id?: number
  page?: number
  limit?: number
  generalFuzzyValue?: string
  generalFuzzyFields?: string[]
  includeMaterials?: boolean
  order?: string
  activationStatus?: string
}

export type SupplierResponse = {
  meta: SupplierParams
  count: { total: number; page: number }
  data: Supplier[]
}

export type MaterialParams = {
  id?: number
  supplierId?: number
  page?: number
  limit?: number
  includeSupplier?: boolean
  generalFuzzyValue?: string
  activationStatus?: string
}

export type MaterialResponse = {
  meta: MaterialParams
  count: { total: number; page: number }
  data: Material[]
}
