import { Request } from 'express'
import { QuoteRevisionPostParams, QuoteRevisionPostBody } from './types'
import { extractNumber } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, QuoteRevisionPostBody, {}>
): QuoteRevisionPostParams => {
    const { parentId } = req.body ?? {}

    const params = {} as QuoteRevisionPostParams

    params.parentId = extractNumber(parentId, {
        allowUndefined: false,
        errorMessage: 'Invalid parentId',
    }) as number

    return params
}
