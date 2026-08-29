import { Request } from 'express'
import { QuoteFileDeleteParams, QuoteFileDeleteRequest } from './types'
import { extractNumber } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, {}, QuoteFileDeleteRequest>
): QuoteFileDeleteParams => {
    const { id } = req.query ?? {}

    const params: QuoteFileDeleteParams = {} as QuoteFileDeleteParams

    params.id = extractNumber(id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
    }) as number

    return params
}
