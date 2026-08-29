import { DatabaseUser, formatFromDatabase } from '.'
import { convertIfPostgresError, createPostgresClient } from '..'

export const remove = async ({ id }: { id: string }) => {
    try {
        const sql = createPostgresClient()

        const query = await sql<DatabaseUser[]>`
            UPDATE "user" SET deletedAt = NOW() WHERE id = ${id} RETURNING *;
        `
        await sql.end()

        return query.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error deleting user:', error)
        throw error
    }
}
