import { UserFuzzyFields, OrderOptions } from 'data/account'
import { User } from '@novadmin/lib/types'
import { ActivationStatusFilter, StringList } from '@novadmin/lib/types'

export type UserGetRequest = {
    id?: number
    profileId?: number
    includePermissions?: boolean
    generalFuzzyValue?: string
    generalFuzzyFields?: StringList<UserFuzzyFields>
    activationStatus?: ActivationStatusFilter
    order?: OrderOptions
    page?: number
    limit?: number
}

export type UserGetParams = {
    id?: number
    profileId?: number
    includePermissions?: boolean
    generalFuzzy: {
        value?: string
        fields?: UserFuzzyFields[]
    }
    activationStatus: ActivationStatusFilter
    order: OrderOptions
    page: number
    limit: number
}

export type UserGetResponse =
    | {
          meta: UserGetParams
          count: {
              total: number
              page: number
          }
          data: User[]
      }
    | {
          error: string
      }

export { UserFuzzyFields }
