import { DatabaseUser, formatFromDatabase } from '.'
import { convertIfPostgresError, createPostgresClient } from '..'

export const remove = async ({ id }: { id: number }) => {
    try {
        const sql = createPostgresClient()

        const user = await sql<DatabaseUser[]>`
            UPDATE "user" SET deletedAt = NOW() WHERE id = ${id} RETURNING *;
        `
        await sql.end()

        return {
            user: user.map(formatFromDatabase),
        }
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error soft deleting user:', error)
        throw error
    }
}
