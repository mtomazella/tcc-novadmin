import { Request } from 'express'
import { QuoteElementBatchPostParams, QuoteElementBatchPostBody } from './types'
import { RequestParameterValidationError } from 'error/index'
import { validateAndExtractUpsertRecord } from '../common'

export const extractParams = (
    req: Request<{}, {}, QuoteElementBatchPostBody, {}>
): QuoteElementBatchPostParams => {
    const { records } = req.body ?? {}

    if (!records || !Array.isArray(records)) {
        throw new RequestParameterValidationError(
            'Missing records in request body'
        )
    }

    const params: QuoteElementBatchPostParams = {
        records: records.map(validateAndExtractUpsertRecord),
    } as QuoteElementBatchPostParams

    return params
}
