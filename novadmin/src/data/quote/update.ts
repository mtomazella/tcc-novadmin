import { Sql } from 'postgres'
import {
    DatabaseQuote,
    formatFromDatabase,
    UpdateGeneralQuoteRecord,
    UpdateQuoteCostsRecord,
    UpdateQuoteDocumentRecord,
} from '.'
import {
    convertIfPostgresError,
    createPostgresClient,
    validateUpsertParams,
} from '..'
import { getLock } from './lock'
import { UpsertError } from 'error/index'

export const update = async ({
    sql: outsideSql,
    record,
}: {
    sql?: Sql
    userId?: number
    record: UpdateGeneralQuoteRecord
}) => {
    try {
        validateUpsertParams(record)

        const sql = outsideSql ?? createPostgresClient()

        const query = await sql<DatabaseQuote[]>`
            UPDATE quote
            SET
                products = '${sql.unsafe(JSON.stringify(record.products ?? {}))}'::jsonb
            WHERE id = ${record.id}
            RETURNING *;
        `
        if (!outsideSql) {
            await sql.end()
        }

        return query.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error upserting quote:', error)
        throw error
    }
}

export const updateCosts = async ({
    sql: outsideSql,
    userId,
    ignoreLock = false,
    record,
}: {
    sql?: Sql
    userId?: number
    ignoreLock?: boolean
    record: UpdateQuoteCostsRecord
}) => {
    try {
        validateUpsertParams(record)

        const sql = outsideSql ?? createPostgresClient()
        const runner = sql.begin ? sql.begin : async (cb: any) => cb(sql)

        const query = await runner(async (sql) => {
            if (!ignoreLock && record.id) {
                const lock = await getLock({
                    sql,
                    id: record.id,
                    userId,
                })

                if (lock.isCostsLockedByAnotherUser) {
                    throw new UpsertError(
                        'QuoteCosts is locked by another user'
                    )
                }

                if (!lock.isCostsLocked) {
                    throw new UpsertError(
                        'Lock the record before updating it for safety'
                    )
                }
            }

            // Omit a column from SET entirely when its field isn't provided,
            // rather than writing `col = DEFAULT` — the latter resets the
            // column to its schema default (e.g. wipes products back to
            // '{}'), it does NOT mean "leave unchanged".
            const query = await sql<DatabaseQuote[]>`
                UPDATE quote
                SET
                    selected_pricing_option_id = ${record.selectedPricingOptionId ?? null}
                    ${
                        record.pricingOptions
                            ? sql`, pricing_options = '${sql.unsafe(JSON.stringify(record.pricingOptions))}'::jsonb`
                            : sql``
                    }
                    ${
                        record.fixedCosts
                            ? sql`, fixed_costs = '${sql.unsafe(JSON.stringify(record.fixedCosts))}'::jsonb`
                            : sql``
                    }
                    ${
                        record.productConsumption
                            ? sql`, product_consumption = '${sql.unsafe(JSON.stringify(record.productConsumption))}'::jsonb`
                            : sql``
                    }
                    ${
                        record.products
                            ? sql`, products = '${sql.unsafe(JSON.stringify(record.products))}'::jsonb`
                            : sql``
                    }
                WHERE id = ${record.id}
                RETURNING *;
            `

            return query
        })
        if (!outsideSql) {
            await sql.end()
        }

        return query.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error updating quoteCosts:', error)
        throw error
    }
}

export const updateDocument = async ({
    sql: outsideSql,
    userId,
    ignoreLock = false,
    record,
}: {
    sql?: Sql
    userId?: number
    ignoreLock?: boolean
    record: UpdateQuoteDocumentRecord
}) => {
    try {
        validateUpsertParams(record)

        const sql = outsideSql ?? createPostgresClient()

        const query = await sql.begin(async (sql) => {
            if (!ignoreLock && record.id) {
                const lock = await getLock({
                    sql,
                    id: record.id,
                    userId,
                })

                if (lock.isDocumentLockedByAnotherUser) {
                    throw new UpsertError(
                        'QuoteDocument is locked by another user'
                    )
                }

                if (!lock.isDocumentLocked) {
                    throw new UpsertError(
                        'Lock the record before updating it for safety'
                    )
                }
            }

            const query = await sql<DatabaseQuote[]>`
                UPDATE quote
                SET
                    document_options = ${
                        record.documentOptions
                            ? sql`'${sql.unsafe(JSON.stringify(record.documentOptions))}'::jsonb`
                            : sql`DEFAULT`
                    }
                WHERE id = ${record.id}
                RETURNING *;
            `

            return query
        })
        if (!outsideSql) {
            await sql.end()
        }

        return query.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error updating quoteDocument:', error)
        throw error
    }
}
