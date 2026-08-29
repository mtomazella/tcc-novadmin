import {
    DatabaseKeys,
    IncludeDatabaseDates,
    OptionalId,
    User,
} from '@novadmin/lib/types'

export type DatabaseUser = DatabaseKeys<IncludeDatabaseDates<User>>

export const formatFromDatabase = (
    user: DatabaseUser
): IncludeDatabaseDates<User> => {
    const newUser: IncludeDatabaseDates<User> & DatabaseUser = {
        ...user,
        createdAt: user.createdat,
        updatedAt: user.updatedat,
        deletedAt: user.deletedat,
    }
    delete (newUser as any).total_count
    delete (newUser as any).createdat
    delete (newUser as any).updatedat
    delete (newUser as any).deletedat
    return newUser
}

export type UpsertUserRecord = OptionalId<User> & {
    permissions?: string[]
    password?: string
}

export * from './list'
export * from './upsert'
export * from './remove'
