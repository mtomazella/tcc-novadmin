import { User } from '@novadmin/lib/types'

export type LoginBody = {
    username: string
    password: string
}

export type LoginParams = LoginBody & {}

export type LoginResponse =
    | {
          token: string
          expiresAt: string
          user: User
      }
    | {
          error: string
          details?: any
      }
