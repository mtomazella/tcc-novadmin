import { UpsertProfileRecord } from 'data/profile'
import { Profile } from '@novadmin/lib/types'

export type ProfilePostBody = {
    record: UpsertProfileRecord
}

export type ProfilePostParams = ProfilePostBody & {}

export type ProfilePostResponse =
    | {
          meta: ProfilePostParams
          data: Profile[]
      }
    | {
          error: string
          details?: any
      }
