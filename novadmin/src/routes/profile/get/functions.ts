import { Request } from 'express'
import { ProfileGetParams, ProfileGetRequest } from './types'
import { extractNumber, extractString } from 'utils/request'
import { ProfileFuzzyFields } from 'data/profile'

export const extractParams = (
    req: Request<{}, {}, {}, ProfileGetRequest>
): ProfileGetParams => {
    const {
        id,
        generalFuzzyFields,
        generalFuzzyValue,
        order,
        page,
        limit,
    } = req.query

    const params: ProfileGetParams = {
        generalFuzzy: {},
    } as ProfileGetParams

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

    params.generalFuzzy.value = extractString(generalFuzzyValue, {
        allowUndefined: true,
        errorMessage: 'Invalid generalFuzzyValue',
    }) as string | undefined

    if (generalFuzzyValue) {
        const allGeneralFuzzyFields = ['name', 'description'] as ProfileFuzzyFields[]
        if (!generalFuzzyFields) {
            params.generalFuzzy.fields = allGeneralFuzzyFields
        } else {
            params.generalFuzzy.fields = generalFuzzyFields
                .split(',')
                .map((s) => s.trim())
                .filter((s) =>
                    (allGeneralFuzzyFields as string[]).includes(s)
                ) as ProfileFuzzyFields[]
        }
    }

    params.order = extractString(order, {
        allowUndefined: true,
        defaultValue: 'updatedAt_desc',
        errorMessage: 'Invalid order',
    }) as ProfileGetParams['order']

    return params
}
