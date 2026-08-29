import { Request } from 'express'
import { QuoteDocumentLockPostParams, QuoteDocumentLockPostBody } from './types'
import { extractNumber } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, QuoteDocumentLockPostBody, {}>
): QuoteDocumentLockPostParams => {
    const body = req.body ?? {}

    const params = {} as QuoteDocumentLockPostParams

    params.id = extractNumber(body.id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
    }) as number

    return params
}
