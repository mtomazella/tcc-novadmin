import { Request } from 'express'
import { QuoteScopePostParams, QuoteScopePostBody } from './types'
import { validateAndExtractUpsertRecord } from '../common'

export const extractParams = (
    req: Request<{}, {}, QuoteScopePostBody, {}>
): QuoteScopePostParams => {
    const { record } = req.body ?? {}

    const params = {
        record: validateAndExtractUpsertRecord(record),
    } as QuoteScopePostParams

    return params
}
