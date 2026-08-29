import { Request } from 'express'
import { QuoteSyncPostParams, QuoteSyncPostBody } from './types'
import { extractBoolean, extractNumber, extractString } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, QuoteSyncPostBody, {}>
): QuoteSyncPostParams => {
    const { quoteId, elements } = req.body ?? {}

    const params = {
        elements: {},
    } as QuoteSyncPostParams

    params.quoteId = extractNumber(quoteId, {
        allowUndefined: false,
        errorMessage: 'Invalid quoteId',
    }) as number

    params.elements = {
        fixedCosts: {
            operation: extractString(elements?.fixedCosts?.operation, {
                allowUndefined: true,
                errorMessage: 'Invalid fixedCosts.operation',
                validationFunction: (value) =>
                    ['merge', 'replace'].includes(value ?? ''),
            }) as 'merge' | 'replace',
        },
        pricingOptions: {
            operation: extractString(elements?.pricingOptions?.operation, {
                allowUndefined: true,
                errorMessage: 'Invalid pricingOptions.operation',
                validationFunction: (value) =>
                    ['replace', 'merge'].includes(value ?? ''),
            }) as 'replace' | 'merge',
        },
        products: {
            operation: extractString(elements?.products?.operation, {
                allowUndefined: true,
                errorMessage: 'Invalid products.operation',
                validationFunction: (value) =>
                    ['merge', 'replace'].includes(value ?? ''),
            }) as 'merge' | 'replace',
        },
        scopes: {
            fixedCosts: {
                clearScopeOverrides: extractBoolean(
                    elements?.scopes?.fixedCosts?.clearScopeOverrides,
                    {
                        allowUndefined: true,
                        errorMessage:
                            'Invalid scopes.fixedCosts.clearScopeOverrides',
                    }
                ),
            },
            includedProductConsumptions: {
                clearScopeOverrides: extractBoolean(
                    elements?.scopes?.includedProductConsumptions
                        ?.clearScopeOverrides,
                    {
                        allowUndefined: true,
                        errorMessage:
                            'Invalid scopes.includedProductConsumptions.clearScopeOverrides',
                    }
                ),
            },
        },
    }

    return params
}
