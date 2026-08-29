import { UpsertUserRecord } from 'data/user'
import { Romaneio as User } from '@novadmin/lib/types'

export type UserPostBody = {
    record: UpsertUserRecord
}

export type UserPostParams = {
    record: UpsertUserRecord
}

export type UserPostResponse =
    | {
          meta: UserPostParams
          data: User[]
      }
    | {
          error: string
          details?: any
      }
