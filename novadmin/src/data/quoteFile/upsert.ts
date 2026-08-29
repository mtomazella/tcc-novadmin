import { Sql } from 'postgres'
import { DatabaseQuoteFile, formatFromDatabase, UpsertQuoteFileRecord } from '.'
import {
    convertIfPostgresError,
    createPostgresClient,
    validateUpsertParams,
} from '..'

export const upsert = async ({
    sql: outsideSql,
    userId,
    record,
}: {
    sql?: Sql
    userId?: number
    record: UpsertQuoteFileRecord
}) => {
    try {
        validateUpsertParams(record)

        const sql = outsideSql ?? createPostgresClient()

        const query = await sql<DatabaseQuoteFile[]>`
            INSERT INTO quote_file (
                id,
                quote_id,
                name,
                file_content,
                uploaded_by
            ) VALUES (
                ${record.id ?? sql`DEFAULT`},
                ${record.quoteId},
                ${record.name},
                ${record.fileContent ?? sql`DEFAULT`},
                ${userId ?? sql`DEFAULT`}
            )
            ON CONFLICT (id) DO UPDATE SET
                quote_id = EXCLUDED.quote_id,
                name = EXCLUDED.name,
                file_content = EXCLUDED.file_content,
                uploaded_by = EXCLUDED.uploaded_by,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `
        if (!outsideSql) {
            await sql.end()
        }

        return query.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error upserting quoteFile:', error)
        throw error
    }
}
