import { IncludeDatabaseDates, Profile } from '@novadmin/lib/types'

export type DatabaseProfile = {
    id: number
    name: string
    description: string | null
    departments: string[]
    permissions?: string[]
    createdat: Date
    updatedat: Date
    deletedat: Date | null
    total_count?: number
}

export type UpsertProfileRecord = {
    id?: number
    name: string
    description: string
    departments?: string[]
    permissions?: string[]
}

export type ProfileFuzzyFields = 'name' | 'description'

export const formatFromDatabase = (
    profile: DatabaseProfile
): IncludeDatabaseDates<Profile> => {
    const newRecord: any = {
        id: profile.id,
        name: profile.name,
        description: profile.description,
        departments: profile.departments ?? [],
        permissions: profile.permissions ?? [],
        createdAt: profile.createdat,
        updatedAt: profile.updatedat,
        deletedAt: profile.deletedat,
    }

    return newRecord
}

export * from './list'
export * from './upsert'
export * from './remove'
