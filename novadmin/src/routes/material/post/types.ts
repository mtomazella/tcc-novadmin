import { Material } from '@novadmin/lib/types'

export type MaterialPostBody = {
    record: Material
}

export type MaterialPostParams = MaterialPostBody & {}

export type MaterialPostResponse =
    | {
          meta: MaterialPostParams
          data: Material[]
      }
    | {
          error: string
          details?: any
      }
