const WEB_ACTION_TO_BACKEND_ACTION: Record<string, string> = {
    view: 'list',
    edit: 'upsert',
    add: 'upsert',
    delete: 'delete',
}

const WEB_PERMISSION_PATTERN = /^web:([a-z0-9_-]+):([a-z0-9-]+)$/

export const expandWithBackendPermissions = (
    permissions: string[]
): string[] => {
    const expanded = new Set(permissions)

    for (const permission of permissions) {
        const match = permission.match(WEB_PERMISSION_PATTERN)
        if (!match) continue

        const [, screen, action] = match
        const backendAction = WEB_ACTION_TO_BACKEND_ACTION[action]

        if (backendAction) {
            expanded.add(`${screen}:${backendAction}`)
        }

        if (screen === 'user' && (action === 'edit' || action === 'add')) {
            expanded.add('user:permission:upsert')
            expanded.add('user:password:change')
        }
    }

    return Array.from(expanded)
}