import { User } from '@novadmin/lib/types'

export type UserDeleteRequest = {
    id: number
}

export type UserDeleteParams = UserDeleteRequest & {}

export type UserDeleteResponse =
    | {
          meta: UserDeleteParams
          data: User[]
      }
    | {
          error: string
          details?: any
      }
