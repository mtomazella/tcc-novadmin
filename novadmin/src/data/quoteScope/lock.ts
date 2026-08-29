import { Sql } from 'postgres'
import { createPostgresClient } from '..'
import { evaluateLockInformation } from '.'
import { UpsertError } from 'error/index'

export const getLock = async ({
    sql: outsideSql,
    id,
    userId,
}: {
    sql?: Sql
    id: number
    userId?: number
}) => {
    const sql = outsideSql ?? createPostgresClient()

    const result = await sql`
        SELECT locked_by_user_id, locked_at
        FROM quote_scope
        WHERE id = ${id};
    `
    if (!outsideSql) {
        await sql.end()
    }

    return evaluateLockInformation({
        lockedByUserId: result[0]?.locked_by_user_id ?? null,
        lockedAt: result[0]?.locked_at ?? null,
        userId,
    })
}

export const lock = async ({
    sql: outsideSql,
    id,
    userId,
    ignoreLockOwnership = false,
}: {
    sql?: Sql
    id: number
    userId: number
    ignoreLockOwnership?: boolean
}) => {
    const sql = outsideSql ?? createPostgresClient()

    const result = await sql.begin(async (sql) => {
        if (!ignoreLockOwnership) {
            if (!userId) {
                throw new UpsertError(
                    'User ID is required to lock with ownership check'
                )
            }

            const lock = await getLock({
                sql,
                id,
                userId,
            })

            if (lock.isLockedByAnotherUser) {
                throw new UpsertError(
                    'Cannot lock: already locked by another user'
                )
            }
        }

        const result = await sql`
            UPDATE quote_scope
            SET locked_by_user_id = ${userId}, locked_at = NOW()
            WHERE id = ${id}
            RETURNING *;
        `

        return result
    })
    if (!outsideSql) {
        await sql.end()
    }

    return evaluateLockInformation({
        lockedByUserId: result[0]?.locked_by_user_id ?? null,
        lockedAt: result[0]?.locked_at ?? null,
        userId,
    })
}

export const unlock = async ({
    sql: outsideSql,
    id,
    userId,
    ignoreLockOwnership = false,
}: {
    sql?: Sql
    id: number
    userId?: number
    ignoreLockOwnership?: boolean
}) => {
    const sql = outsideSql ?? createPostgresClient()

    const result = await sql.begin(async (sql) => {
        if (!ignoreLockOwnership) {
            if (!userId) {
                throw new UpsertError(
                    'User ID is required to unlock with ownership check'
                )
            }

            const lock = await getLock({
                sql,
                id,
                userId,
            })

            if (lock.isLockedByAnotherUser) {
                throw new UpsertError('Cannot unlock: locked by another user')
            }
        }

        const result = await sql`
            UPDATE quote_scope
            SET locked_by_user_id = NULL, locked_at = NULL
            WHERE id = ${id}
            RETURNING *;
        `

        return result
    })
    if (!outsideSql) {
        await sql.end()
    }

    return evaluateLockInformation({
        lockedByUserId: result[0]?.locked_by_user_id ?? null,
        lockedAt: result[0]?.locked_at ?? null,
    })
}
