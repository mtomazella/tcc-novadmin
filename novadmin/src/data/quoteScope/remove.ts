import { DatabaseQuoteScope, formatFromDatabase } from '.'
import { convertIfPostgresError, createPostgresClient } from '..'

export const remove = async ({ id }: { id: number }) => {
    try {
        const sql = createPostgresClient()

        const quoteScope = await sql<DatabaseQuoteScope[]>`
            UPDATE quote_scope SET deleted_at = NOW() WHERE id = ${id} RETURNING *;
        `
        await sql.end()

        return {
            quoteScope: quoteScope.map(formatFromDatabase),
        }
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error soft deleting quoteScope:', error)
        throw error
    }
}
