import { Request } from 'express'
import {
    QuoteElementsUnlockPostParams,
    QuoteElementsUnlockPostBody,
} from './types'
import { extractNumber } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, QuoteElementsUnlockPostBody, {}>
): QuoteElementsUnlockPostParams => {
    const body = req.body ?? {}

    const params = {} as QuoteElementsUnlockPostParams

    params.id = extractNumber(body.id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
    }) as number

    return params
}
