import { QuotePricingOption } from '@novadmin/lib/types'

export type QuotePricingOptionDeleteRequest = {
    id: number
}

export type QuotePricingOptionDeleteParams =
    QuotePricingOptionDeleteRequest & {}

export type QuotePricingOptionDeleteResponse =
    | {
          meta: QuotePricingOptionDeleteParams
          data: QuotePricingOption[]
      }
    | {
          error: string
          details?: any
      }
