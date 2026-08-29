import { Request } from 'express'
import { ProfilePostParams, ProfilePostBody } from './types'
import { RequestParameterValidationError } from 'error/index'
import { extractNumber, extractString } from 'utils/request'
import { permissions as availablePermissions } from '@novadmin/lib/types'

export const extractParams = (
    req: Request<{}, {}, ProfilePostBody, {}>
): ProfilePostParams => {
    const { record } = req.body ?? {}

    const params: ProfilePostParams = {
        record,
    } as ProfilePostParams

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
        validationFunction: (value) => value!.length > 0 && value!.length <= 60,
    }) as string

    params.record.description = extractString(record.description, {
        allowUndefined: false,
        errorMessage: 'Invalid description',
        validationFunction: (value) => value!.length > 0,
    }) as string

    if (record.departments && !Array.isArray(record.departments)) {
        throw new RequestParameterValidationError('Invalid departments')
    }

    if (record.permissions?.length) {
        for (const permission of record.permissions) {
            if (!availablePermissions.includes(permission)) {
                console.log("Permissões disponíveis: " + availablePermissions, "Permissão necessária: " + permission)
                throw new RequestParameterValidationError(
                    `Invalid permission: ${permission}`
                )
            }
        }
    }

    return params
}
