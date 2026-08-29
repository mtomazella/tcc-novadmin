import { DatabaseSupplier, formatFromDatabase } from '.'
import { convertIfPostgresError, createPostgresClient } from '..'

export const remove = async ({ id }: { id: number }) => {
    try {
        const sql = createPostgresClient()

        const supplier = await sql<DatabaseSupplier[]>`
            UPDATE supplier SET deleted_at = NOW() WHERE id = ${id} RETURNING *;
        `
        await sql.end()

        return {
            supplier: supplier.map(formatFromDatabase),
        }
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error soft deleting supplier:', error)
        throw error
    }
}
