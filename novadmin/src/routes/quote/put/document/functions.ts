import { Request } from 'express'
import { QuoteDocumentPutParams, QuoteDocumentPutBody } from './types'
import { extractNumber } from 'utils/request'
import { RequestParameterValidationError } from 'error/index'

export const extractParams = (
    req: Request<{}, {}, QuoteDocumentPutBody, {}>
): QuoteDocumentPutParams => {
    const { record } = req.body ?? {}

    const params = {
        record: {},
    } as QuoteDocumentPutParams

    params.record.id = extractNumber(record.id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
    }) as number

    if (!record.documentOptions) {
        throw new RequestParameterValidationError('Invalid documentOptions')
    }
    params.record.documentOptions = record.documentOptions

    return params
}
