import { Request } from 'express'
import { GeneralFuzzyField, ProductGetParams, ProductGetRequest } from './types'
import { extractBoolean, extractNumber, extractString } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, {}, ProductGetRequest>
): ProductGetParams => {
    const {
        id,
        fuzzyName,
        fuzzyDescription,
        fuzzyShorthand,
        generalFuzzyFields,
        generalFuzzyValue,
        order,
        includeDeleted,
        page,
        limit,
    } = req.query

    const params: ProductGetParams = {
        generalFuzzy: {},
        fuzzy: {},
    } as ProductGetParams

    params.id = extractNumber(id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
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

    params.fuzzy.name = extractString(fuzzyName, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyName',
    }) as string | undefined

    params.fuzzy.description = extractString(fuzzyDescription, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyDescription',
    }) as string | undefined

    params.fuzzy.shorthand = extractString(fuzzyShorthand, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyShorthand',
    }) as string | undefined

    params.generalFuzzy.value = extractString(generalFuzzyValue, {
        allowUndefined: true,
        errorMessage: 'Invalid general fuzzy value',
    }) as string | undefined

    if (generalFuzzyValue) {
        const allGeneralFuzzyFields = ['name', 'description', 'shorthand']
        if (!generalFuzzyFields) {
            params.generalFuzzy.fields =
                allGeneralFuzzyFields as GeneralFuzzyField[]
        } else {
            params.generalFuzzy.fields = generalFuzzyFields
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) =>
                    allGeneralFuzzyFields.includes(s)
                ) as GeneralFuzzyField[]
        }
    }

    params.order = extractString(order, {
        allowUndefined: true,
        defaultValue: 'updatedAt_desc',
        errorMessage: 'Invalid order',
    }) as ProductGetParams['order']

    params.includeDeleted = extractBoolean(includeDeleted, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid includeDeleted',
    }) as boolean

    return params
}
