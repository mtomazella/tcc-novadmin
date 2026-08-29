import { Session } from 'type/auth'
import { DatabaseKeys } from '@novadmin/lib/types'
import {
    convertIfPostgresError,
    createPostgresClient,
    validateUpsertParams,
} from '.'

type DatabaseSession = DatabaseKeys<Session>

const formatFromDatabase = (session: DatabaseSession): Session => {
    const newUser: Session & DatabaseSession = {
        ...session,
        userId: session.userid,
        createdAt: session.createdat,
        expiresAt: session.expiresat,
        usedAt: session.usedat,
        deletedAt: session.deletedat,
    }
    delete (newUser as any).userid
    delete (newUser as any).createdat
    delete (newUser as any).expiresat
    delete (newUser as any).usedat
    delete (newUser as any).deletedat
    return newUser
}

export const getUserRefreshTokens = async ({
    userId,
}: {
    userId: number
}): Promise<{ data: Session[] }> => {
    const sql = createPostgresClient()

    const query = await sql<DatabaseSession[]>`
        SELECT * FROM session WHERE userid = ${userId} AND deletedat IS NULL;
    `
    await sql.end()

    return { data: query.map(formatFromDatabase) }
}

export const validateSession = async ({
    token,
    userId,
}: {
    token: string
    userId: number
}) => {
    const sql = createPostgresClient()

    // TODO: It would be good to see if the token was already used, but we would need to implement separate sessions for each device for that and I don't want to take the time to do that right now.
    const query = await sql<DatabaseSession[]>`
        SELECT * FROM session
        WHERE token = ${token} AND userid = ${userId} AND deletedat IS NULL;
    `
    await sql.end()

    if (query.length === 0) {
        return null
    }

    const session = formatFromDatabase(query[0])

    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        return null
    }

    return session
}

export const upsert = async ({
    record,
}: {
    record: Pick<Session, 'token' | 'userId' | 'expiresAt' | 'usedAt'>
}): Promise<Session> => {
    try {
        validateUpsertParams(record)

        const sql = createPostgresClient()

        const query = await sql<DatabaseSession[]>`
            INSERT INTO session (
                token,
                userid,
                expiresat,
                usedat
            ) VALUES (
                ${record.token},
                ${record.userId},
                ${record.expiresAt},
                ${record.usedAt ?? sql`DEFAULT`}
            )
            ON CONFLICT (token) DO UPDATE SET
                userid = EXCLUDED.userid,
                createdat = EXCLUDED.createdat,
                expiresat = EXCLUDED.expiresat,
                usedat = EXCLUDED.usedat,
                deletedat = EXCLUDED.deletedat
            RETURNING *;
        `
        await sql.end()

        return formatFromDatabase(query[0])
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error upserting session:', error)
        throw error
    }
}
