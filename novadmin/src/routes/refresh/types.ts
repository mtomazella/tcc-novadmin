import { User } from '@novadmin/lib/types'

export type RefreshBody = {
    token: string
    userId: number
}

export type RefreshParams = RefreshBody & {}

export type RefreshResponse =
    | {
          token: string
          expiresAt: string
          refresh: {
              token: string
              expiresAt: string
          }
          user: User
      }
    | {
          error: string
          details?: any
      }
