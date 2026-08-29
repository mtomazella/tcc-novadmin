import { Client, OptionalId } from '@novadmin/lib/types'

export type ClientDeleteRequest = {
    id: string
}

export type ClientDeleteParams = ClientDeleteRequest & {}

export type ClientDeleteResponse =
    | {
          meta: ClientDeleteParams
          data: Client[]
      }
    | {
          error: string
          details?: any
      }
