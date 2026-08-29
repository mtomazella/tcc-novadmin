import { Sql } from 'postgres'
import {
    DatabaseQuoteFixedCost,
    formatFromDatabase,
    UpsertQuoteFixedCostRecord,
} from '.'
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
    record: UpsertQuoteFixedCostRecord
}) => {
    try {
        validateUpsertParams(record)

        const sql = outsideSql ?? createPostgresClient()

        const query = await sql<DatabaseQuoteFixedCost[]>`
            INSERT INTO quote_fixed_cost (id, name, description, value_type, value)
            VALUES (
                ${record.id},
                ${record.name},
                ${record.description ?? sql`DEFAULT`},
                ${record.valueType},
                ${record.value}
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                value_type = EXCLUDED.value_type,
                value = EXCLUDED.value
            RETURNING *;
        `
        if (!outsideSql) {
            await sql.end()
        }

        return query.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error upserting quoteFixedCost:', error)
        throw error
    }
}

export const batchUpsert = async ({
    records,
}: {
    records: UpsertQuoteFixedCostRecord[]
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
        console.error('Error in batch upserting quoteFixedCosts:', error)
        throw error
    }
}
