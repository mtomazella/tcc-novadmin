import { Request } from 'express'
import { UserFuzzyFields, UserGetParams, UserGetRequest } from './types'
import {
    extractActivationStatus,
    extractBoolean,
    extractNumber,
    extractString,
} from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, {}, UserGetRequest>
): UserGetParams => {
    const {
        id,
        profileId,
        includePermissions,
        generalFuzzyFields,
        generalFuzzyValue,
        activationStatus,
        order,
        page,
        limit,
    } = req.query

    const params: UserGetParams = {
        generalFuzzy: {},
    } as UserGetParams

    params.id = extractNumber(id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
    }) as number | undefined

    params.profileId = extractNumber(profileId, {
        allowUndefined: true,
        errorMessage: 'Invalid profileId',
    }) as number | undefined

    params.includePermissions = extractBoolean(includePermissions, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid includePermissions',
    })

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
        const allGeneralFuzzyFields = ['name', 'role', 'email'] as UserFuzzyFields[]
        if (!generalFuzzyFields) {
            params.generalFuzzy.fields = allGeneralFuzzyFields
        } else {
            params.generalFuzzy.fields = generalFuzzyFields
                .split(',')
                .map((s) => s.trim())
                .filter((s) =>
                    (allGeneralFuzzyFields as string[]).includes(s)
                ) as UserFuzzyFields[]
        }
    }

    params.activationStatus = extractActivationStatus(activationStatus, {
        allowUndefined: true,
        defaultStatus: 'active',
        errorMessage: 'Invalid activationStatus',
    }) as UserGetParams['activationStatus']

    params.order = extractString(order, {
        allowUndefined: true,
        defaultValue: 'updatedAt_desc',
        errorMessage: 'Invalid order',
    }) as UserGetParams['order']

    return params
}
