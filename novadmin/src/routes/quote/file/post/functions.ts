import { RequestParameterValidationError } from 'error/index'
import { Request } from 'express'
import { QuoteFilePostParams, QuoteFilePostBody } from './types'
import { extractNumber, extractString } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, QuoteFilePostBody, {}>
): QuoteFilePostParams => {
    const { record } = req.body ?? {}

    const params: QuoteFilePostParams = { record: {} } as QuoteFilePostParams

    if (!record) {
        throw new RequestParameterValidationError(
            'Missing record in request body'
        )
    }

    params.record.id = extractNumber(record.id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
    }) as number | undefined

    params.record.quoteId = extractNumber(record.quoteId, {
        allowUndefined: false,
        errorMessage: 'Invalid quoteId',
    }) as number

    params.record.name = extractString(record.name, {
        errorMessage: 'Invalid name',
    }) as string

    params.record.fileContent = extractString(
        record.fileContent as string | undefined,
        {
            errorMessage: 'Invalid image',
            allowUndefined: true,
        }
    ) as string | undefined

    return params
}
