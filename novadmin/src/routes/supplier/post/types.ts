import { Supplier } from '@novadmin/lib/types'

export type SupplierPostBody = {
    record: Supplier
}

export type SupplierPostParams = SupplierPostBody & {}

export type SupplierPostResponse =
    | {
          meta: SupplierPostParams
          data: Supplier[]
      }
    | {
          error: string
          details?: any
      }
