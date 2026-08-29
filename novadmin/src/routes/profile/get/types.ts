import { ProfileFuzzyFields, OrderOptions } from 'data/profile'
import { Profile } from '@novadmin/lib/types'
import { StringList } from '@novadmin/lib/types'

export type ProfileGetRequest = {
    id?: number
    generalFuzzyValue?: string
    generalFuzzyFields?: StringList<ProfileFuzzyFields>
    order?: OrderOptions
    page?: number
    limit?: number
}

export type ProfileGetParams = {
    id?: number
    generalFuzzy: {
        value?: string
        fields?: ProfileFuzzyFields[]
    }
    order: OrderOptions
    page: number
    limit: number
}

export type ProfileGetResponse =
    | {
          meta: ProfileGetParams
          count: {
              total: number
              page: number
          }
          data: Profile[]
      }
    | {
          error: string
      }
