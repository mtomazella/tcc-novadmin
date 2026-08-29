import { Sql } from 'postgres'
import { DatabaseMaterial, formatFromDatabase, UpsertMaterialRecord } from '.'
import {
    convertIfPostgresError,
    createPostgresClient,
    validateUpsertParams,
} from '..'

export const upsert = async ({
    sql: outsideSql,
    record,
}: {
    sql?: Sql
    record: UpsertMaterialRecord
}) => {
    try {
        validateUpsertParams(record)

        const sql = outsideSql ?? createPostgresClient()

        const query = await sql<DatabaseMaterial[]>`
            INSERT INTO material (id, supplier_id, sku, name, description, type, value)
            VALUES (
                ${record.id ?? sql`DEFAULT`},
                ${record.supplierId},
                ${record.sku},
                ${record.name},
                ${record.description ?? sql`DEFAULT`},
                ${record.type},
                ${record.value}
            )
            ON CONFLICT (id) DO UPDATE SET
                supplier_id = EXCLUDED.supplier_id,
                sku = EXCLUDED.sku,
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                type = EXCLUDED.type,
                value = EXCLUDED.value
            RETURNING *;
        `
        if (!outsideSql) {
            await sql.end()
        }

        return query.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error upserting material:', error)
        throw error
    }
}

export const batchUpsert = async ({
    records,
}: {
    records: UpsertMaterialRecord[]
}) => {
    try {
        const results: (Awaited<ReturnType<typeof upsert>> | unknown)[] = []

        const sql = createPostgresClient()

        await sql.begin(async (sql) => {
            for (const record of records) {
                try {
                    const upsertResult = await upsert({ sql, record })
                    results.push(upsertResult)
                } catch (error) {
                    results.push(error)
                }
            }
        })
        await sql.end()

        return results.flat()
    } catch (error) {
        console.error('Error in batch upserting materials:', error)
        throw error
    }
}
