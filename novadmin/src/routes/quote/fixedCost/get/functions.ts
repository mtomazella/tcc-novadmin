import { Request } from 'express'
import { QuoteFixedCostGetParams, QuoteFixedCostGetRequest } from './types'
import {
    extractActivationStatus,
    extractNumber,
    extractString,
    extractStringList,
} from 'utils/request'
import { QuoteFixedCostFuzzyFields } from 'data/quoteFixedCost'
import {
    QuoteFixedCostValueType,
    QuoteFixedCostValueTypes,
} from '@novadmin/lib/types'

export const extractParams = (
    req: Request<{}, {}, {}, QuoteFixedCostGetRequest>
): QuoteFixedCostGetParams => {
    const {
        id,
        valueTypes,
        generalFuzzyFields,
        generalFuzzyValue,
        order,
        activationStatus,
        page,
        limit,
    } = req.query

    const params: QuoteFixedCostGetParams = {
        generalFuzzy: {},
    } as QuoteFixedCostGetParams

    params.id = extractString(id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
    }) as string | undefined

    params.valueTypes = extractStringList(valueTypes, {
        allowUndefined: true,
        errorMessage: 'Invalid valueTypes',
        defaultValue: undefined,
        allowedValues: QuoteFixedCostValueTypes,
    }) as QuoteFixedCostValueType[] | undefined

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
        ] as QuoteFixedCostFuzzyFields[]
        if (!generalFuzzyFields) {
            params.generalFuzzy.fields =
                allGeneralFuzzyFields as QuoteFixedCostFuzzyFields[]
        } else {
            params.generalFuzzy.fields = generalFuzzyFields
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) =>
                    (allGeneralFuzzyFields as string[]).includes(s)
                ) as QuoteFixedCostFuzzyFields[]
        }
    }

    params.order = extractString(order, {
        allowUndefined: true,
        defaultValue: 'updatedAt_desc',
        errorMessage: 'Invalid order',
    }) as QuoteFixedCostGetParams['order']

    params.activationStatus = extractActivationStatus(activationStatus, {
        allowUndefined: true,
        defaultStatus: 'active',
        errorMessage: 'Invalid activationStatus',
    }) as QuoteFixedCostGetParams['activationStatus']

    return params
}
