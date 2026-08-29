import { Request } from 'express'
import { QuoteElementGetParams, QuoteElementGetRequest } from './types'
import {
    extractActivationStatus,
    extractBoolean,
    extractNumber,
    extractString,
} from 'utils/request'
import { QuoteElementFuzzyFields } from 'data/quoteElement'

export const extractParams = (
    req: Request<{}, {}, {}, QuoteElementGetRequest>
): QuoteElementGetParams => {
    const {
        id,
        quoteId,
        scopeId,
        productId,
        type,
        generalFuzzyFields,
        generalFuzzyValue,
        includeProductName,
        includeProduct,
        includeScope,
        order,
        activationStatus,
        page,
        limit,
    } = req.query

    const params: QuoteElementGetParams = {
        generalFuzzy: {},
    } as QuoteElementGetParams

    params.id = extractNumber(id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
    }) as number | undefined

    params.quoteId = extractNumber(quoteId, {
        allowUndefined: true,
        errorMessage: 'Invalid quoteId',
    }) as number | undefined

    params.scopeId = extractNumber(scopeId, {
        allowUndefined: true,
        errorMessage: 'Invalid scopeId',
    }) as number | undefined

    params.productId = extractNumber(productId, {
        allowUndefined: true,
        errorMessage: 'Invalid productId',
    }) as number | undefined

    params.type = extractString(type, {
        allowUndefined: true,
        errorMessage: 'Invalid type',
    }) as QuoteElementGetParams['type']

    params.includeProductName = extractBoolean(includeProductName, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid includeProductName',
    }) as boolean

    params.includeProduct = extractBoolean(includeProduct, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid includeProduct',
    }) as boolean

    params.includeScope = extractBoolean(includeScope, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid includeScope',
    }) as boolean

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
        const allGeneralFuzzyFields = ['name'] as QuoteElementFuzzyFields[]
        if (!generalFuzzyFields) {
            params.generalFuzzy.fields =
                allGeneralFuzzyFields as QuoteElementFuzzyFields[]
        } else {
            params.generalFuzzy.fields = generalFuzzyFields
                .split(',')
                .map((s) => s.trim())
                .filter((s) =>
                    (allGeneralFuzzyFields as string[]).includes(s)
                ) as QuoteElementFuzzyFields[]
        }
    }

    params.order = extractString(order, {
        allowUndefined: true,
        defaultValue: 'name_asc',
        errorMessage: 'Invalid order',
    }) as QuoteElementGetParams['order']

    params.activationStatus = extractActivationStatus(activationStatus, {
        allowUndefined: true,
        defaultStatus: 'active',
        errorMessage: 'Invalid activationStatus',
    }) as QuoteElementGetParams['activationStatus']

    return params
}
