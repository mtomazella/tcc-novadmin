import { PermissionError } from 'error/index'
import { Permission } from '@novadmin/lib/types'

export const checkPermissions = ({
    userPermissions = [],
    requiredPermissions = [],
}: {
    userPermissions: Permission[] | undefined
    requiredPermissions: Permission[] | undefined
}) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        throw new PermissionError('Invalid permissions')
    }

    if (
        !requiredPermissions.every((permission) =>
            userPermissions.includes(permission)
        )
    ) {
        const missingPermissions = requiredPermissions.filter(
            (permission) => !userPermissions.includes(permission)
        )
        throw new PermissionError(
            `Permission denied. Required: ${missingPermissions.join(', ')}`
        )
    }

    return true
}
