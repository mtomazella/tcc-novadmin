import { OrderOptions } from 'data/user'
import { IncludeDatabaseDates, User } from '@novadmin/lib/types'
import { ActivationStatusFilter, StringList } from '@novadmin/lib/types'

export type GeneralFuzzyField = 'name' | 'role' | 'email'

export type UserGetRequest = {
    id?: string
    fuzzyName?: string
    fuzzyRole?: string
    fuzzyEmail?: string
    generalFuzzyValue?: string
    generalFuzzyFields?: StringList<GeneralFuzzyField>
    includePermissions?: string
    activationStatus?: ActivationStatusFilter
    order?: OrderOptions
    page?: number
    limit?: number
}

export type UserGetParams = {
    id?: number
    generalFuzzy: {
        value?: string
        fields?: GeneralFuzzyField[]
    }
    fuzzy: {
        name?: string
        role?: string
        email?: string
    }
    includePermissions?: boolean
    itemActivationStatus: ActivationStatusFilter
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
          data: IncludeDatabaseDates<User>[]
      }
    | {
          error: string
      }
