import { Request } from 'express'
import { GeneralFuzzyField, UserGetParams, UserGetRequest } from './types'
import {
    extractActivationStatus,
    extractBoolean,
    extractNumber,
    extractString,
} from 'utils/request'
import { User } from '@novadmin/lib/types'
import { checkPermissions } from 'auth/permissions'
import { PermissionError } from 'error/index'

export const extractParams = (
    req: Request<{}, {}, {}, UserGetRequest>
): UserGetParams => {
    const {
        id,
        fuzzyName,
        fuzzyRole,
        fuzzyEmail,
        generalFuzzyFields,
        generalFuzzyValue,
        includePermissions,
        activationStatus,
        order,
        page,
        limit,
    } = req.query

    const params: UserGetParams = {
        fuzzy: {},
        generalFuzzy: {},
    } as UserGetParams

    params.id = extractNumber(id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
    }) as number | undefined

    params.includePermissions = extractBoolean(includePermissions, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid includePermissions',
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

    params.fuzzy.name = extractString(fuzzyName, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyName',
    }) as string | undefined

    params.fuzzy.role = extractString(fuzzyRole, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyRole',
    }) as string | undefined

    params.fuzzy.email = extractString(fuzzyEmail, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyEmail',
    }) as string | undefined

    if (generalFuzzyValue) {
        params.generalFuzzy.value = generalFuzzyValue

        if (!generalFuzzyFields) {
            params.generalFuzzy.fields = ['name', 'role', 'email']
        } else {
            params.generalFuzzy.fields = generalFuzzyFields
                .split(',')
                .map((s) => s.trim())
                .filter((s) =>
                    ['name', 'role', 'email'].includes(s)
                ) as GeneralFuzzyField[]
        }
    }

    params.activationStatus = extractActivationStatus(activationStatus)

    params.order = extractString(order, {
        allowUndefined: true,
        defaultValue: 'updatedAt_desc',
        errorMessage: 'Invalid order',
    }) as UserGetParams['order']

    return params
}

export const validatePermissions = ({
    user,
    params,
}: {
    user: User
    params: UserGetParams
}) => {
    const userId = user?.id
    const permissions = user?.permissions ?? []

    if (!userId) {
        throw new PermissionError(
            'User ID is required for permission validation. There was a problem with authentication.'
        )
    }

    if (params.id && params.id === userId) {
        checkPermissions({
            userPermissions: permissions,
            requiredPermissions: ['user:own:list'],
        })

        if (params.includePermissions) {
            checkPermissions({
                userPermissions: permissions,
                requiredPermissions: ['user:own:permission:list'],
            })
        }
    } else {
        checkPermissions({
            userPermissions: permissions,
            requiredPermissions: ['user:list'],
        })

        if (params.includePermissions) {
            checkPermissions({
                userPermissions: permissions,
                requiredPermissions: ['user:permission:list'],
            })
        }
    }
}
