import { Product } from '@novadmin/lib/types'

export type ProductDeleteRequest = {
    id: string
}

export type ProductDeleteParams = ProductDeleteRequest & {}

export type ProductDeleteResponse =
    | {
          meta: ProductDeleteParams
          data: Product[]
      }
    | {
          error: string
          details?: any
      }
