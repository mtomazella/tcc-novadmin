import { Request } from 'express'
import { QuoteElementDeleteParams, QuoteElementDeleteRequest } from './types'
import { extractNumber } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, {}, QuoteElementDeleteRequest>
): QuoteElementDeleteParams => {
    const { id } = req.query ?? {}

    const params: QuoteElementDeleteParams = {} as QuoteElementDeleteParams

    params.id = extractNumber(id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
    }) as number

    return params
}
