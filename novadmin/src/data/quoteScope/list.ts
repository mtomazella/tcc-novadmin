import { IncludeDatabaseDates, QuoteScope } from '@novadmin/lib/types'
import {
    createPostgresClient,
    generateGeneralFuzzyClause,
    getEntityFuzzyFields,
    getOrderByClause,
    validateListParams,
} from '..'
import { DatabaseQuoteScope, formatFromDatabase, QuoteScopeFuzzyField } from '.'
import { ActivationStatusFilter } from '@novadmin/lib/types'
import { Sql } from 'postgres'

export type OrderOptions = 'updatedAt' | 'createdAt' | 'name'

export const defaultOrderOption: OrderOptions = 'name'

export const list = async (params: {
    sql?: Sql
    id?: number
    quoteId?: number
    generalFuzzy?: {
        value?: string
        fields?: Array<QuoteScopeFuzzyField>
    }
    activationStatus: ActivationStatusFilter
    order?: OrderOptions
    page: number
    limit: number
    userId?: number
}): Promise<{
    data: IncludeDatabaseDates<QuoteScope>[]
    count: {
        page: number
        total: number
    }
    page: number
    limit: number
    userId?: number
}> => {
    validateListParams(params)

    const {
        sql: outsideSql,
        id,
        quoteId,
        page,
        limit,
        activationStatus,
        generalFuzzy,
        order = defaultOrderOption,
        userId,
    } = params

    const sql = outsideSql ?? createPostgresClient()

    const { hasGeneralFuzzy, stringGeneralFuzzyClause } =
        generateGeneralFuzzyClause({
            sql,
            fields: getEntityFuzzyFields(generalFuzzy?.fields, ''),
            value: generalFuzzy?.value ?? '',
            tablePrefix: 's.',
        })

    const query = await sql<(DatabaseQuoteScope & { total_count: number })[]>`
        SELECT 
            s.*,
            COUNT(*) OVER() AS total_count
        FROM quote_scope s
        WHERE 1 = 1 
            ${id ? sql`AND s.id = ${id}` : sql``}
            ${quoteId ? sql`AND s.quote_id = ${quoteId}` : sql``}
            ${
                activationStatus !== 'all'
                    ? activationStatus === 'active'
                        ? sql`AND s.deleted_at IS NULL`
                        : sql`AND s.deleted_at IS NOT NULL`
                    : sql``
            }
            ${
                hasGeneralFuzzy
                    ? sql.unsafe(`AND ( 
                        ${[stringGeneralFuzzyClause]
                            .filter((c) => c)
                            .join(' OR ')}
                    )`)
                    : sql``
            }
        GROUP BY s.id
        ${
            order
                ? sql.unsafe(
                      getOrderByClause({
                          order,
                          map: {
                              updatedAt: 's.updated_at',
                              createdAt: 's.created_at',
                              name: 's.name',
                          },
                          default: defaultOrderOption,
                      })
                  )
                : sql``
        }
        LIMIT ${limit} OFFSET ${(page - 1) * limit};
    `
    if (!outsideSql) {
        await sql.end()
    }

    return {
        count: {
            page: query.length,
            total: Number(query[0]?.total_count ?? 0),
        },
        data: query.map((s) => formatFromDatabase(s, userId)),
        page,
        limit,
    }
}
