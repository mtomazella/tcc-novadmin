import { Request } from 'express'
import { QuoteScopeGetParams, QuoteScopeGetRequest } from './types'
import {
    extractActivationStatus,
    extractBoolean,
    extractNumber,
    extractString,
} from 'utils/request'
import { QuoteScopeFuzzyField } from 'data/quoteScope'

export const extractParams = (
    req: Request<{}, {}, {}, QuoteScopeGetRequest>
): QuoteScopeGetParams => {
    const {
        id,
        quoteId,
        generalFuzzyFields,
        generalFuzzyValue,
        includeProductName,
        activationStatus,
        order,
        page,
        limit,
    } = req.query

    const params: QuoteScopeGetParams = {
        generalFuzzy: {},
    } as QuoteScopeGetParams

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

    params.generalFuzzy.value = extractString(generalFuzzyValue, {
        allowUndefined: true,
        errorMessage: 'Invalid generalFuzzyValue',
    }) as string | undefined

    if (generalFuzzyValue) {
        const allGeneralFuzzyFields = ['name'] as QuoteScopeFuzzyField[]
        if (!generalFuzzyFields) {
            params.generalFuzzy.fields =
                allGeneralFuzzyFields as QuoteScopeFuzzyField[]
        } else {
            params.generalFuzzy.fields = generalFuzzyFields
                .split(',')
                .map((s) => s.trim())
                .filter((s) =>
                    (allGeneralFuzzyFields as string[]).includes(s)
                ) as QuoteScopeFuzzyField[]
        }
    }

    params.order = extractString(order, {
        allowUndefined: true,
        defaultValue: 'name_asc',
        errorMessage: 'Invalid order',
    }) as QuoteScopeGetParams['order']

    params.activationStatus = extractActivationStatus(activationStatus, {
        allowUndefined: true,
        defaultStatus: 'active',
        errorMessage: 'Invalid activationStatus',
    }) as QuoteScopeGetParams['activationStatus']

    return params
}
