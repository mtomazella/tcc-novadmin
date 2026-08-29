import { Request } from 'express'
import { QuoteCostsUnlockPostParams, QuoteCostsUnlockPostBody } from './types'
import { extractNumber } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, QuoteCostsUnlockPostBody, {}>
): QuoteCostsUnlockPostParams => {
    const body = req.body ?? {}

    const params = {} as QuoteCostsUnlockPostParams

    params.id = extractNumber(body.id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
    }) as number

    return params
}
