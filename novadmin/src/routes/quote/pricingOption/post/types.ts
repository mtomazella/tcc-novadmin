import { QuotePricingOption } from '@novadmin/lib/types'

export type QuotePricingOptionPostBody = {
    record: QuotePricingOption
}

export type QuotePricingOptionPostParams = QuotePricingOptionPostBody & {}

export type QuotePricingOptionPostResponse =
    | {
          meta: QuotePricingOptionPostParams
          data: QuotePricingOption[]
      }
    | {
          error: string
          details?: any
      }
