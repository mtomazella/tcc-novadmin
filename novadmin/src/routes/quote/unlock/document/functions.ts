import { Request } from 'express'
import {
    QuoteDocumentUnlockPostParams,
    QuoteDocumentUnlockPostBody,
} from './types'
import { extractNumber } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, QuoteDocumentUnlockPostBody, {}>
): QuoteDocumentUnlockPostParams => {
    const body = req.body ?? {}

    const params = {} as QuoteDocumentUnlockPostParams

    params.id = extractNumber(body.id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
    }) as number

    return params
}
