import { DatabaseQuoteFile, formatFromDatabase } from '.'
import { convertIfPostgresError, createPostgresClient } from '..'

export const remove = async ({ id }: { id: number }) => {
    try {
        const sql = createPostgresClient()

        const rows = await sql<Omit<DatabaseQuoteFile, 'file_content'>[]>`
            UPDATE quote_file
            SET deleted_at = NOW()
            WHERE id = ${id}
            RETURNING id, quote_id, name, uploaded_by, created_at, updated_at, deleted_at;
        `
        await sql.end()

        return {
            quoteFile: rows.map(formatFromDatabase),
        }
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error soft deleting quoteFile:', error)
        throw error
    }
}
