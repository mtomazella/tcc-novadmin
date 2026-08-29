import { Request } from 'express'
import {
    QuotePricingOptionDeleteParams,
    QuotePricingOptionDeleteRequest,
} from './types'
import { extractNumber } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, {}, QuotePricingOptionDeleteRequest>
): QuotePricingOptionDeleteParams => {
    const { id } = req.query ?? {}

    const params: QuotePricingOptionDeleteParams =
        {} as QuotePricingOptionDeleteParams

    params.id = extractNumber(id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
    }) as number

    return params
}
