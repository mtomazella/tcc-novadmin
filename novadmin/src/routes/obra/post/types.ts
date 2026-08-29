import { Obra, OptionalId } from '@novadmin/lib/types'

export type ObraPostBody = {
    record: OptionalId<Obra>
}

export type ObraPostParams = ObraPostBody & {}

export type ObraPostResponse =
    | {
          meta: ObraPostParams
          data: Obra[]
      }
    | {
          error: string
          details?: any
      }
