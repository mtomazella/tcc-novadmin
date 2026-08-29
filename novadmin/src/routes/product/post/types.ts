import { Product } from '@novadmin/lib/types'

export type ProductPostBody = {
    record: Product
}

export type ProductPostParams = ProductPostBody & {}

export type ProductPostResponse =
    | {
          meta: ProductPostParams
          data: Product[]
      }
    | {
          error: string
          details?: any
      }
