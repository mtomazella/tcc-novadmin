import { Request } from 'express'
import { UserPostParams, UserPostBody } from './types'
import { RequestParameterValidationError } from 'error/index'
import { extractBoolean, extractNumber, extractString } from 'utils/request'
import { permissions as availablePermissions } from '@novadmin/lib/types'

export const extractParams = (
    req: Request<{}, {}, UserPostBody, {}>
): UserPostParams => {
    const { record } = req.body ?? {}

    const params: UserPostParams = {
        record,
    } as UserPostParams

    if (!record) {
        throw new RequestParameterValidationError(
            'Missing record in request body'
        )
    }

    params.record.id = extractNumber(record.id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
    }) as number | undefined

    params.record.name = extractString(record.name, {
        allowUndefined: false,
        errorMessage: 'Invalid name',
        validationFunction: (value) => value!.length > 0 && value!.length <= 50,
    }) as string

    params.record.email = extractString(record.email, {
        allowUndefined: false,
        errorMessage: 'Invalid email',
        validationFunction: (value) => value!.length > 0 && value!.length <= 254,
    }) as string

    if (!record.id && !record.password) {
        throw new RequestParameterValidationError(
            'Password is required for creating a new user'
        )
    }

    params.record.password = extractString(record.password, {
        allowUndefined: true,
        errorMessage: 'Invalid password',
    }) as string | undefined

    if (!record.id && !record.profileId) {
        throw new RequestParameterValidationError(
            'Profile is required for creating a new user'
        )
    }

    if (record.profileId !== undefined) {
        params.record.profileId = extractNumber(record.profileId, {
            allowUndefined: false,
            errorMessage: 'Invalid profileId',
        }) as number
    }

    params.record.isAdmin = extractBoolean(record.isAdmin, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid isAdmin',
    })

    if (record.permissions?.length) {
        for (const permission of record.permissions) {
            if (!availablePermissions.includes(permission)) {
                throw new RequestParameterValidationError(
                    `Invalid permission: ${permission}`
                )
            }
        }
    }

    return params
}
