import { DatabaseSupplier, formatFromDatabase, UpsertSupplierRecord } from '.'
import {
    convertIfPostgresError,
    createPostgresClient,
    validateUpsertParams,
} from '..'

export const upsert = async ({ record }: { record: UpsertSupplierRecord }) => {
    try {
        validateUpsertParams(record)

        const sql = createPostgresClient()

        const query = await sql<DatabaseSupplier[]>`
            INSERT INTO supplier (id, name)
            VALUES (
                ${record.id ?? sql`DEFAULT`},
                ${record.name}
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name
            RETURNING *;
        `
        await sql.end()

        return query.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error upserting supplier:', error)
        throw error
    }
}
