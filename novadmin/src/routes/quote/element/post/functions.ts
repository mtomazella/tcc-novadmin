import { Request } from 'express'
import { QuoteElementPostParams, QuoteElementPostBody } from './types'
import { validateAndExtractUpsertRecord } from '../common'

export const extractParams = (
    req: Request<{}, {}, QuoteElementPostBody, {}>
): QuoteElementPostParams => {
    const { record } = req.body ?? {}

    const params = {
        record: validateAndExtractUpsertRecord(record),
    }

    return params
}
