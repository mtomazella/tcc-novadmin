import { Sql } from 'postgres'
import { createPostgresClient } from '..'
import { evaluateLockInformation as evaluateLockInformationFromFormatted } from '.'
import { UpsertError } from 'error/index'

const evaluateLockInformation = ({
    result,
    userId,
}: {
    result: Record<string, any>
    userId: number | undefined
}) =>
    evaluateLockInformationFromFormatted({
        elementsLockedByUserId: result[0]?.elements_locked_by_user_id ?? null,
        elementsLockedAt: result[0]?.elements_locked_at ?? null,
        costsLockedByUserId: result[0]?.costs_locked_by_user_id ?? null,
        costsLockedAt: result[0]?.costs_locked_at ?? null,
        documentLockedByUserId: result[0]?.document_locked_by_user_id ?? null,
        documentLockedAt: result[0]?.document_locked_at ?? null,
        userId,
    })

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
        SELECT
            elements_locked_by_user_id,
            elements_locked_at,
            costs_locked_by_user_id,
            costs_locked_at,
            document_locked_by_user_id,
            document_locked_at
        FROM quote
        WHERE id = ${id};
    `
    if (!outsideSql) {
        await sql.end()
    }

    return evaluateLockInformation({
        result,
        userId,
    })
}

export const lockElements = async ({
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

            if (lock.isElementsLockedByAnotherUser) {
                throw new UpsertError(
                    'Cannot lock: already locked by another user'
                )
            }
        }

        const result = await sql`
            UPDATE quote
            SET elements_locked_by_user_id = ${userId}, elements_locked_at = NOW()
            WHERE id = ${id}
            RETURNING *;
        `

        return result
    })
    if (!outsideSql) {
        await sql.end()
    }

    return evaluateLockInformation({
        result,
        userId,
    })
}

export const unlockElements = async ({
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

            if (lock.isElementsLockedByAnotherUser) {
                throw new UpsertError('Cannot unlock: locked by another user')
            }
        }

        const result = await sql`
            UPDATE quote
            SET elements_locked_by_user_id = NULL, elements_locked_at = NULL
            WHERE id = ${id}
            RETURNING *;
        `

        return result
    })
    if (!outsideSql) {
        await sql.end()
    }

    return evaluateLockInformation({
        result,
        userId,
    })
}

export const lockCosts = async ({
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

            if (lock.isCostsLockedByAnotherUser) {
                throw new UpsertError(
                    'Cannot lock: already locked by another user'
                )
            }
        }

        const result = await sql`
            UPDATE quote
            SET costs_locked_by_user_id = ${userId}, costs_locked_at = NOW()
            WHERE id = ${id}
            RETURNING *;
        `

        return result
    })
    if (!outsideSql) {
        await sql.end()
    }

    return evaluateLockInformation({
        result,
        userId,
    })
}

export const unlockCosts = async ({
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

            if (lock.isCostsLockedByAnotherUser) {
                throw new UpsertError('Cannot unlock: locked by another user')
            }
        }

        const result = await sql`
            UPDATE quote
            SET costs_locked_by_user_id = NULL, costs_locked_at = NULL
            WHERE id = ${id}
            RETURNING *;
        `

        return result
    })
    if (!outsideSql) {
        await sql.end()
    }

    return evaluateLockInformation({
        result,
        userId,
    })
}

export const lockDocument = async ({
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

            if (lock.isDocumentLockedByAnotherUser) {
                throw new UpsertError(
                    'Cannot lock: already locked by another user'
                )
            }
        }

        const result = await sql`
            UPDATE quote
            SET document_locked_by_user_id = ${userId}, document_locked_at = NOW()
            WHERE id = ${id}
            RETURNING *;
        `

        return result
    })
    if (!outsideSql) {
        await sql.end()
    }

    return evaluateLockInformation({
        result,
        userId,
    })
}

export const unlockDocument = async ({
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

            if (lock.isDocumentLockedByAnotherUser) {
                throw new UpsertError('Cannot unlock: locked by another user')
            }
        }

        const result = await sql`
            UPDATE quote
            SET document_locked_by_user_id = NULL, document_locked_at = NULL
            WHERE id = ${id}
            RETURNING *;
        `

        return result
    })
    if (!outsideSql) {
        await sql.end()
    }

    return evaluateLockInformation({
        result,
        userId,
    })
}
