import { Sql } from 'postgres'
import {
    DatabaseQuotePricingOption,
    formatFromDatabase,
    UpsertQuotePricingOptionRecord,
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
    record: UpsertQuotePricingOptionRecord
}) => {
    try {
        validateUpsertParams(record)

        const sql = outsideSql ?? createPostgresClient()

        const query = await sql<DatabaseQuotePricingOption[]>`
            INSERT INTO quote_pricing_option (id, name, description, value_reto, value_cambotado, value_garfo)
            VALUES (
                ${record.id ?? sql`DEFAULT`},
                ${record.name},
                ${record.description ?? sql`DEFAULT`},
                ${record.valueReto},
                ${record.valueCambotado ?? sql`DEFAULT`},
                ${record.valueGarfo}
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                value_reto = EXCLUDED.value_reto,
                value_cambotado = EXCLUDED.value_cambotado,
                value_garfo = EXCLUDED.value_garfo
            RETURNING *;
        `
        if (!outsideSql) {
            await sql.end()
        }

        return query.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error upserting quotePricingOption:', error)
        throw error
    }
}

export const batchUpsert = async ({
    records,
}: {
    records: UpsertQuotePricingOptionRecord[]
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
        console.error('Error in batch upserting quotePricingOptions:', error)
        throw error
    }
}
