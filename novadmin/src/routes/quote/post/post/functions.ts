import { Request } from 'express'
import { QuotePostParams, QuotePostBody } from './types'
import { extractNumber, extractString } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, QuotePostBody, {}>
): QuotePostParams => {
    const {
        clientId,
        obraId,
        quoteNumber,
        revisionNumber,
        additionNumber,
        yearCode,
    } = req.body ?? {}

    const params = {} as QuotePostParams

    params.clientId = extractNumber(clientId, {
        allowUndefined: false,
        errorMessage: 'Invalid clientId',
    }) as number

    params.obraId = extractNumber(obraId, {
        allowUndefined: false,
        errorMessage: 'Invalid obraId',
    }) as number

    params.quoteNumber = extractString(quoteNumber, {
        allowUndefined: true,
        errorMessage: 'Invalid quoteNumber',
    }) as string | undefined

    params.revisionNumber = extractNumber(revisionNumber, {
        allowUndefined: true,
        errorMessage: 'Invalid revisionNumber',
    }) as number | undefined

    params.additionNumber = extractNumber(additionNumber, {
        allowUndefined: true,
        errorMessage: 'Invalid additionNumber',
    }) as number | undefined

    params.yearCode = extractNumber(yearCode, {
        allowUndefined: true,
        errorMessage: 'Invalid yearCode',
    }) as number | undefined

    return params
}
