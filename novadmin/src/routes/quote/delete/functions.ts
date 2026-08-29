import { Request } from 'express'
import { QuoteDeleteParams, QuoteDeleteRequest } from './types'
import { extractNumber } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, {}, QuoteDeleteRequest>
): QuoteDeleteParams => {
    const { id } = req.query ?? {}

    const params: QuoteDeleteParams = {} as QuoteDeleteParams

    params.id = extractNumber(id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
    }) as number

    return params
}
