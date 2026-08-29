import { DatabaseQuoteElement, formatFromDatabase } from '.'
import { convertIfPostgresError, createPostgresClient } from '..'

export const remove = async ({ id }: { id: number }) => {
    try {
        const sql = createPostgresClient()

        const quoteElement = await sql<DatabaseQuoteElement[]>`
            UPDATE quote_element SET deleted_at = NOW() WHERE id = ${id} RETURNING *;
        `
        await sql.end()

        return {
            quoteElement: quoteElement.map(formatFromDatabase),
        }
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error soft deleting quoteElement:', error)
        throw error
    }
}
