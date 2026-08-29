import { Supplier } from '@novadmin/lib/types'

export type SupplierDeleteRequest = {
    id: number
}

export type SupplierDeleteParams = SupplierDeleteRequest & {}

export type SupplierDeleteResponse =
    | {
          meta: SupplierDeleteParams
          data: Supplier[]
      }
    | {
          error: string
          details?: any
      }
