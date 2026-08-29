import bcrypt from 'bcryptjs'
import { DatabaseUser, formatFromDatabase, UpsertUserRecord } from '.'
import {
    convertIfPostgresError,
    createPostgresClient,
    validateUpsertParams,
} from '..'
import { expandWithBackendPermissions } from 'utils/permissionmapping'

const SALT_ROUNDS = 10

export const upsert = async ({ record }: { record: UpsertUserRecord }) => {
    try {
        validateUpsertParams(record)

        const sql = createPostgresClient()

        const passwordHash = record.password
            ? await bcrypt.hash(record.password, SALT_ROUNDS)
            : undefined

        if (!record.id && !passwordHash) {
            throw new Error('Password is required for creating a new user')
        }

        const result = await sql.begin(async (sql) => {
            const [user] = record.id
                ? await sql<DatabaseUser[]>`
                    UPDATE "user" SET
                        name = ${record.name},
                        email = ${record.email},
                        profileId = ${record.profileId},
                        isAdmin = ${record.isAdmin ?? false}
                        ${passwordHash ? sql`, password = ${passwordHash}` : sql``}
                    WHERE id = ${record.id}
                    RETURNING *;
                `
                : await sql<DatabaseUser[]>`
                    INSERT INTO "user" (name, email, password, profileId, isAdmin)
                    VALUES (
                        ${record.name},
                        ${record.email},
                        ${passwordHash as string},
                        ${record.profileId},
                        ${record.isAdmin ?? false}
                    )
                    RETURNING *;
                `

            if (record.permissions !== undefined) {
                const permissionsToGrant = expandWithBackendPermissions(
                    record.permissions
                )

                await sql`DELETE FROM user_permission WHERE userId = ${user.id}`

                for (const permissionId of permissionsToGrant) {
                    await sql`
                        INSERT INTO user_permission (userId, permissionId)
                        VALUES (${user.id}, ${permissionId})
                    `
                }
            }

            const [{ permissions }] = await sql<{ permissions: string[] }[]>`
                SELECT COALESCE(JSON_AGG(permissionId), '[]'::json) AS permissions
                FROM user_permission WHERE userId = ${user.id};
            `

            const [profile] = await sql<{ name: string }[]>`
                SELECT name FROM profile WHERE id = ${user.profileid};
            `

            return { ...user, permissions, profilename: profile?.name ?? null }
        })

        await sql.end()

        return [formatFromDatabase(result as DatabaseUser)]
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error upserting user:', error)
        throw error
    }
}
