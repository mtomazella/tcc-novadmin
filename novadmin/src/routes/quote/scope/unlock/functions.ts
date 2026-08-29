import { Request } from 'express'
import { QuoteScopeUnlockPostParams, QuoteScopeUnlockPostBody } from './types'
import { extractNumber } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, QuoteScopeUnlockPostBody, {}>
): QuoteScopeUnlockPostParams => {
    const body = req.body ?? {}

    const params = {} as QuoteScopeUnlockPostParams

    params.id = extractNumber(body.id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
    }) as number

    return params
}
