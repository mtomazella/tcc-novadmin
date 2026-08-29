import { DatabaseMaterial, formatFromDatabase } from '.'
import { convertIfPostgresError, createPostgresClient } from '..'

export const remove = async ({ id }: { id: number }) => {
    try {
        const sql = createPostgresClient()

        const material = await sql<DatabaseMaterial[]>`
            UPDATE material SET deleted_at = NOW() WHERE id = ${id} RETURNING *;
        `
        await sql.end()

        return {
            material: material.map(formatFromDatabase),
        }
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error soft deleting material:', error)
        throw error
    }
}
