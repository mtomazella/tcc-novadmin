import { DatabaseProfile, formatFromDatabase } from '.'
import { convertIfPostgresError, createPostgresClient } from '..'

export const remove = async ({ id }: { id: number }) => {
    try {
        const sql = createPostgresClient()

        const profile = await sql<DatabaseProfile[]>`
            UPDATE profile SET deletedAt = NOW() WHERE id = ${id} RETURNING *;
        `
        await sql.end()

        return {
            profile: profile.map(formatFromDatabase),
        }
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error soft deleting profile:', error)
        throw error
    }
}
