import { Request } from 'express'
import { QuoteFileGetParams, QuoteFileGetRequest } from './types'
import {
    extractActivationStatus,
    extractBoolean,
    extractNumber,
    extractString,
} from 'utils/request'
import { OrderOptions } from 'data/quoteFile'

export const extractParams = (
    req: Request<{}, {}, {}, QuoteFileGetRequest>
): QuoteFileGetParams => {
    const {
        id,
        quoteId,
        activationStatus,
        order,
        page,
        limit,
        includeContent,
    } = req.query

    const params = {} as QuoteFileGetParams

    params.id = extractNumber(id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
    }) as number | undefined

    params.quoteId = extractNumber(quoteId, {
        allowUndefined: true,
        errorMessage: 'Invalid quoteId',
    }) as number | undefined

    params.page = extractNumber(page, {
        allowUndefined: true,
        defaultValue: 1,
        errorMessage: 'Invalid page',
    }) as number

    params.limit = extractNumber(limit, {
        allowUndefined: true,
        defaultValue: 10,
        errorMessage: 'Invalid limit',
    }) as number

    params.order = extractString(order, {
        allowUndefined: true,
        defaultValue: 'name_asc',
        errorMessage: 'Invalid order',
    }) as OrderOptions

    params.activationStatus = extractActivationStatus(activationStatus, {
        allowUndefined: true,
        defaultStatus: 'active',
        errorMessage: 'Invalid activationStatus',
    }) as QuoteFileGetParams['activationStatus']

    params.includeContent = extractBoolean(includeContent, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid includeContent',
    }) as boolean

    return params
}
