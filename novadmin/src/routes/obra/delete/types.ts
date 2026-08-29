import { Obra } from '@novadmin/lib/types'

export type ObraDeleteRequest = {
    id: string
}

export type ObraDeleteParams = ObraDeleteRequest & {}

export type ObraDeleteResponse =
    | {
          meta: ObraDeleteParams
          data: Obra[]
      }
    | {
          error: string
          details?: any
      }
