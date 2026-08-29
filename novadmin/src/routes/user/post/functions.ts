import { Request } from 'express'
import { UserPostParams, UserPostBody } from './types'
import { PermissionError, RequestParameterValidationError } from 'error/index'
import { permissions as availablePermissions } from '@novadmin/lib/types'
import { User } from '@novadmin/lib/types'
import { checkPermissions } from 'auth/permissions'

export const extractParams = (
    req: Request<{}, {}, UserPostBody, {}>
): UserPostParams => {
    const { record } = req.body ?? {}

    const params: UserPostParams = {} as UserPostParams

    if (!record) {
        throw new RequestParameterValidationError(
            'Missing record in request body'
        )
    }

    if (!record.name) {
        throw new RequestParameterValidationError('Name is required')
    }

    if (!record.email) {
        throw new RequestParameterValidationError('Email is required')
    }

    if (!record.id && !record.password) {
        throw new RequestParameterValidationError(
            'Password is required for creating a new user'
        )
    }

    params.record = record

    if (record.permissions?.length) {
        const permissions = record.permissions.map((p) => p.trim())

        for (const permission of permissions) {
            if (!availablePermissions.includes(permission)) {
                throw new RequestParameterValidationError(
                    `Invalid permission: ${permission}`
                )
            }
        }
    }

    return params
}

export const validatePermissions = ({
    user,
    params: { record },
}: {
    user: User
    params: UserPostParams
}) => {
    const userId = user?.id
    const permissions = user?.permissions ?? []

    if (!userId) {
        throw new PermissionError(
            'User ID is required for permission validation. There was a problem with authentication.'
        )
    }

    if (record.id && record.id === userId) {
        checkPermissions({
            userPermissions: permissions,
            requiredPermissions: ['user:own:upsert'],
        })

        if (record.permissions !== undefined) {
            checkPermissions({
                userPermissions: permissions,
                requiredPermissions: ['user:own:permission:upsert'],
            })
        }

        if (record.password !== undefined) {
            checkPermissions({
                userPermissions: permissions,
                requiredPermissions: ['user:own:password:change'],
            })
        }
    } else {
        checkPermissions({
            userPermissions: permissions,
            requiredPermissions: ['user:upsert'],
        })

        if (record.permissions) {
            checkPermissions({
                userPermissions: permissions,
                requiredPermissions: ['user:permission:upsert'],
            })
        }

        if (record.password) {
            checkPermissions({
                userPermissions: permissions,
                requiredPermissions: ['user:password:change'],
            })
        }
    }
}
