import { Material } from '@novadmin/lib/types'

export type MaterialDeleteRequest = {
    id: number
}

export type MaterialDeleteParams = MaterialDeleteRequest & {}

export type MaterialDeleteResponse =
    | {
          meta: MaterialDeleteParams
          data: Material[]
      }
    | {
          error: string
          details?: any
      }
