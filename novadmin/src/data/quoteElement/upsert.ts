import { Sql } from 'postgres'
import {
    DatabaseQuoteElement,
    formatFromDatabase,
    UpsertQuoteElementRecord,
} from '.'
import {
    convertIfPostgresError,
    createPostgresClient,
    validateUpsertParams,
} from '..'
import { getLock } from 'data/quote/lock'
import { UpsertError } from 'error/index'

export const upsert = async ({
    sql: outsideSql,
    record,
    userId,
    ignoreLock = false,
}: {
    sql?: Sql
    record: UpsertQuoteElementRecord
    userId?: number
    ignoreLock?: boolean
}) => {
    try {
        validateUpsertParams(record)

        const sql = outsideSql ?? createPostgresClient()
        const runner = sql.begin ? sql.begin : async (cb: any) => cb(sql)

        const result = await runner(async (sql) => {
            if (!ignoreLock) {
                const lock = await getLock({
                    sql,
                    id: record.quoteId,
                    userId,
                })

                if (lock.isElementsLockedByAnotherUser) {
                    throw new UpsertError(
                        'Quote elements are locked by another user'
                    )
                }
            }

            const query = await sql<DatabaseQuoteElement[]>`
                INSERT INTO quote_element (id, quote_id, scope_id, product_id, type, name, values)
                VALUES (
                    ${record.id ?? sql`DEFAULT`},
                    ${record.quoteId},
                    ${record.scopeId ?? sql`DEFAULT`},
                    ${record.productId},
                    ${record.type},
                    ${record.name},
                    '${sql.unsafe(JSON.stringify(record.values))}'::jsonb
                )
                ON CONFLICT (id) DO UPDATE SET
                    quote_id = EXCLUDED.quote_id,
                    scope_id = EXCLUDED.scope_id,
                    product_id = EXCLUDED.product_id,
                    type = EXCLUDED.type,
                    name = EXCLUDED.name,
                    values = EXCLUDED.values
                RETURNING *;
            `

            return query
        })
        if (!outsideSql) {
            await sql.end()
        }

        return result.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error upserting quoteElement:', error)
        throw error
    }
}

export const batchUpsert = async ({
    records,
}: {
    records: UpsertQuoteElementRecord[]
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
        console.error('Error in batch upserting quoteElements:', error)
        throw error
    }
}
