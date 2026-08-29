import { UpsertUserRecord } from 'data/account'
import { User } from '@novadmin/lib/types'

export type UserPostBody = {
    record: UpsertUserRecord
}

export type UserPostParams = UserPostBody & {}

export type UserPostResponse =
    | {
          meta: UserPostParams
          data: User[]
      }
    | {
          error: string
          details?: any
      }
