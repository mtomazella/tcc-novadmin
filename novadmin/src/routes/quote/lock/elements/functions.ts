import { Request } from 'express'
import { QuoteElementsLockPostParams, QuoteElementsLockPostBody } from './types'
import { extractNumber } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, QuoteElementsLockPostBody, {}>
): QuoteElementsLockPostParams => {
    const body = req.body ?? {}

    const params = {} as QuoteElementsLockPostParams

    params.id = extractNumber(body.id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
    }) as number

    return params
}
