import { QuotePricingOption } from '@novadmin/lib/types'

export type QuotePricingOptionBatchPostBody = {
    records: QuotePricingOption[]
}

export type QuotePricingOptionBatchPostParams =
    QuotePricingOptionBatchPostBody & {}

export type QuoteFixedCostBatchPostResponse =
    | {
          meta: QuotePricingOptionBatchPostParams
          data: QuotePricingOption[]
      }
    | {
          error: string
          details?: any
      }
