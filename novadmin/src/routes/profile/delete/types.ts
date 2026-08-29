import { Profile } from '@novadmin/lib/types'

export type ProfileDeleteRequest = {
    id: number
}

export type ProfileDeleteParams = ProfileDeleteRequest & {}

export type ProfileDeleteResponse =
    | {
          meta: ProfileDeleteParams
          data: Profile[]
      }
    | {
          error: string
          details?: any
      }
