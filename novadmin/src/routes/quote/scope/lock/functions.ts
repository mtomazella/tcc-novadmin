import { Request } from 'express'
import { QuoteScopeLockPostParams, QuoteScopeLockPostBody } from './types'
import { extractNumber } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, QuoteScopeLockPostBody, {}>
): QuoteScopeLockPostParams => {
    const body = req.body ?? {}

    const params = {} as QuoteScopeLockPostParams

    params.id = extractNumber(body.id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
    }) as number

    return params
}
