import { Request } from 'express'
import {
    QuotePricingOptionGetParams,
    QuotePricingOptionGetRequest,
} from './types'
import {
    extractActivationStatus,
    extractNumber,
    extractString,
} from 'utils/request'
import { QuotePricingOptionFuzzyFields } from 'data/quotePricingOption'

export const extractParams = (
    req: Request<{}, {}, {}, QuotePricingOptionGetRequest>
): QuotePricingOptionGetParams => {
    const {
        id,
        generalFuzzyFields,
        generalFuzzyValue,
        order,
        activationStatus,
        page,
        limit,
    } = req.query

    const params: QuotePricingOptionGetParams = {
        generalFuzzy: {},
    } as QuotePricingOptionGetParams

    params.id = extractString(id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
    }) as string | undefined

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
        const allGeneralFuzzyFields = [
            'name',
            'description',
        ] as QuotePricingOptionFuzzyFields[]
        if (!generalFuzzyFields) {
            params.generalFuzzy.fields =
                allGeneralFuzzyFields as QuotePricingOptionFuzzyFields[]
        } else {
            params.generalFuzzy.fields = generalFuzzyFields
                .split(',')
                .map((s) => s.trim())
                .filter((s) =>
                    (allGeneralFuzzyFields as string[]).includes(s)
                ) as QuotePricingOptionFuzzyFields[]
        }
    }

    params.order = extractString(order, {
        allowUndefined: true,
        defaultValue: 'createdAt_desc',
        errorMessage: 'Invalid order',
    }) as QuotePricingOptionGetParams['order']

    params.activationStatus = extractActivationStatus(activationStatus, {
        allowUndefined: true,
        defaultStatus: 'active',
        errorMessage: 'Invalid activationStatus',
    }) as QuotePricingOptionGetParams['activationStatus']

    return params
}
