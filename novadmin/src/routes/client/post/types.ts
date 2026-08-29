import { Client, OptionalId } from '@novadmin/lib/types'

export type ClientPostBody = {
    record: OptionalId<Client>
}

export type ClientPostParams = ClientPostBody & {}

export type ClientPostResponse =
    | {
          meta: ClientPostParams
          data: Client[]
      }
    | {
          error: string
          details?: any
      }
