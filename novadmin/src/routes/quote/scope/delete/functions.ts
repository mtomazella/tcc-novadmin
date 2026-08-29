import { Request } from 'express'
import { QuoteScopeDeleteParams, QuoteScopeDeleteRequest } from './types'
import { extractNumber } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, {}, QuoteScopeDeleteRequest>
): QuoteScopeDeleteParams => {
    const { id } = req.query ?? {}

    const params: QuoteScopeDeleteParams = {} as QuoteScopeDeleteParams

    params.id = extractNumber(id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
    }) as number

    return params
}
