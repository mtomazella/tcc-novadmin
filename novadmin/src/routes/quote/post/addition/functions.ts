import { Request } from 'express'
import { QuoteAdditionPostParams, QuoteAdditionPostBody } from './types'
import { extractNumber } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, QuoteAdditionPostBody, {}>
): QuoteAdditionPostParams => {
    const { parentId } = req.body ?? {}

    const params = {} as QuoteAdditionPostParams

    params.parentId = extractNumber(parentId, {
        allowUndefined: false,
        errorMessage: 'Invalid parentId',
    }) as number

    return params
}
