import { Material } from '@novadmin/lib/types'

export type MaterialBatchPostBody = {
    records: Material[]
}

export type MaterialBatchPostParams = MaterialBatchPostBody & {}

export type MaterialBatchPostResponse =
    | {
          meta: MaterialBatchPostParams
          data: Material[]
      }
    | {
          error: string
          details?: any
      }
