import { expandWithBackendPermissions } from 'utils/permissionmapping'
import { DatabaseProfile, formatFromDatabase, UpsertProfileRecord } from '.'
import {
    convertIfPostgresError,
    createPostgresClient,
    validateUpsertParams,
} from '..'

export const upsert = async ({ record }: { record: UpsertProfileRecord }) => {
    try {
        validateUpsertParams(record)

        const sql = createPostgresClient()

        const result = await sql.begin(async (sql) => {
            const [profile] = await sql<DatabaseProfile[]>`
                INSERT INTO profile (id, name, description, departments)
                VALUES (
                    ${record.id ?? sql`DEFAULT`},
                    ${record.name},
                    ${record.description},
                    ${sql.json(record.departments ?? [])}
                )
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    departments = EXCLUDED.departments
                RETURNING *;
            `

            if (record.permissions !== undefined) {
                const permissionsToGrant = expandWithBackendPermissions(
                    record.permissions
                )

                await sql`DELETE FROM profile_permission WHERE profileId = ${profile.id}`

                for (const permissionId of permissionsToGrant) {
                    await sql`
                        INSERT INTO profile_permission (profileId, permissionId)
                        VALUES (${profile.id}, ${permissionId})
                    `
                }
            }

            const [{ permissions }] = await sql<{ permissions: string[] }[]>`
                SELECT COALESCE(JSON_AGG(permissionId), '[]'::json) AS permissions
                FROM profile_permission WHERE profileId = ${profile.id};
            `

            return { ...profile, permissions }
        })

        await sql.end()

        return [formatFromDatabase(result as DatabaseProfile)]
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error upserting profile:', error)
        throw error
    }
}