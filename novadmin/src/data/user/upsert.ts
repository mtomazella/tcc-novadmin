import { DatabaseUser, formatFromDatabase, UpsertUserRecord } from '.'
import {
    convertIfPostgresError,
    createPostgresClient,
    validateUpsertParams,
} from '..'
import { list } from './list'

export const upsert = async ({ record }: { record: UpsertUserRecord }) => {
    try {
        validateUpsertParams(record)

        type DatabasePermission = {
            permissionid: string
        }

        const sql = createPostgresClient()

        const { user, deletedPermissions, insertedPermissions } =
            await sql.begin(async (sql) => {
                const currentUser = record.id
                    ? ((
                          await list({
                              id: record.id,
                              page: 1,
                              limit: 1,
                              includePermissions: true,
                              includePassword: true,
                              activationStatus: 'all',
                          })
                      )?.data?.[0] ?? null)
                    : null

                const permissionsToDelete =
                    record.permissions !== undefined
                        ? (currentUser?.permissions ?? []).filter(
                              (permission: string) =>
                                  !record.permissions?.includes(permission)
                          )
                        : []

                const permissionsToInsert =
                    record.permissions !== undefined
                        ? (record.permissions ?? []).filter(
                              (permission) =>
                                  !(currentUser?.permissions ?? []).includes(
                                      permission
                                  )
                          )
                        : []

                const upsertUserRecord = {
                    ...record,
                    password: record.password ?? currentUser?.password,
                }
                const user = await sql<DatabaseUser[]>`
                    INSERT INTO "user" ${sql(
                        upsertUserRecord,
                        ...(['id', 'name', 'role', 'email', 'password'].filter(
                            (field) => (upsertUserRecord as any)[field]
                        ) as unknown as any[])
                    )}
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        role = EXCLUDED.role,
                        email = EXCLUDED.email,
                        password = EXCLUDED.password,
                        updatedAt = NOW()
                    RETURNING id, name, role, email, createdAt, updatedAt, deletedAt;
                `

                let deletedPermissions: DatabasePermission[] = []
                if (permissionsToDelete?.length) {
                    deletedPermissions = await sql<DatabasePermission[]>`
                        DELETE FROM user_permission
                        WHERE userId = ${user[0].id} AND permissionId IN (
                            ${sql.unsafe(permissionsToDelete.map((permission) => `'${permission}'`).join(', '))}
                        )
                        RETURNING permissionId;
                    `
                }

                let insertedPermissions: DatabasePermission[] = []
                if (permissionsToInsert?.length) {
                    insertedPermissions = await sql`
                        INSERT INTO user_permission ${sql(
                            permissionsToInsert.map((permission) => ({
                                userid: user[0].id,
                                permissionid: permission,
                            })),
                            'userid',
                            'permissionid'
                        )}
                        ON CONFLICT (userId, permissionId) DO NOTHING
                        RETURNING permissionId;
                    `
                }

                return { user, deletedPermissions, insertedPermissions }
            })
        await sql.end()

        const formatPermissions = (permission: DatabasePermission) => ({
            id: permission.permissionid,
        })

        return {
            user: (user as unknown as DatabaseUser[]).map(formatFromDatabase),
            deletedPermissions: deletedPermissions.map(formatPermissions),
            insertedPermissions: insertedPermissions.map(formatPermissions),
        }
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error upserting user:', error)
        throw error
    }
}
