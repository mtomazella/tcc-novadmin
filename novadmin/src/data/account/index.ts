import { IncludeDatabaseDates, User } from '@novadmin/lib/types'


export type DatabaseUser = {
    id: number
    name: string
    email: string
    role: string | null
    password: string
    profileid: number | null
    profilename?: string | null
    isadmin: boolean
    permissions?: string[]
    createdat: Date
    updatedat: Date
    deletedat: Date | null
    total_count?: number
}

export type UpsertUserRecord = {
    id?: number
    name: string
    email: string
    /** Plain-text password. Required on create; optional on update (omit to keep the current one). */
    password?: string
    profileId: number
    isAdmin?: boolean
    /** Flat permission strings, e.g. ['web:client:view', 'web:client:add']. */
    permissions?: string[]
}

export type UserFuzzyFields = 'name' | 'role' | 'email'

export const formatFromDatabase = (
    user: DatabaseUser
): IncludeDatabaseDates<User> => {
    const newRecord: any = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileId: user.profileid,
        profileName: user.profilename ?? null,
        isAdmin: user.isadmin,
        permissions: user.permissions ?? [],
        createdAt: user.createdat,
        updatedAt: user.updatedat,
        deletedAt: user.deletedat,
    }

    delete newRecord.password

    return newRecord
}

export * from './list'
export * from './upsert'
export * from './remove'
