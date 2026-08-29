import {
    IncludeDatabaseDates,
    QuoteFixedCostValueType,
    QuoteFixedCost,
} from '@novadmin/lib/types'
import {
    createPostgresClient,
    generateGeneralFuzzyClause,
    getEntityFuzzyFields,
    getOrderByClause,
    validateListParams,
} from '..'
import {
    DatabaseQuoteFixedCost,
    formatFromDatabase,
    QuoteFixedCostFuzzyFields,
} from '.'
import { ActivationStatusFilter } from '@novadmin/lib/types'
import { Sql } from 'postgres'

export type OrderOptions = 'updatedAt' | 'name' | 'valueType'

export const defaultOrderOption: OrderOptions = 'name'

export const list = async (params: {
    sql?: Sql
    id?: string
    valueTypes?: QuoteFixedCostValueType[]
    generalFuzzy?: {
        value?: string
        fields?: QuoteFixedCostFuzzyFields[]
    }
    order?: OrderOptions
    activationStatus: ActivationStatusFilter
    page: number
    limit: number
}): Promise<{
    data: IncludeDatabaseDates<QuoteFixedCost>[]
    count: {
        page: number
        total: number
    }
    page: number
    limit: number
}> => {
    validateListParams(params)

    const {
        sql: outsideSql,
        id,
        valueTypes,
        page,
        limit,
        activationStatus,
        generalFuzzy,
        order = defaultOrderOption,
    } = params

    const sql = outsideSql ?? createPostgresClient()

    const { hasGeneralFuzzy, stringGeneralFuzzyClause } =
        generateGeneralFuzzyClause({
            sql,
            fields: getEntityFuzzyFields(generalFuzzy?.fields, ''),
            value: generalFuzzy?.value ?? '',
            tablePrefix: 'c.',
        })

    const query = await sql<
        (DatabaseQuoteFixedCost & { total_count: number })[]
    >`
        SELECT 
            c.*,
            COUNT(*) OVER() AS total_count
        FROM quote_fixed_cost c
        WHERE 1 = 1 
            ${id ? sql`AND c.id = ${id}` : sql``}
            ${
                valueTypes && valueTypes.length > 0
                    ? sql`AND c.value_type = ANY(${valueTypes})`
                    : sql``
            }
            ${
                activationStatus === 'all'
                    ? sql``
                    : activationStatus === 'active'
                      ? sql`AND c.deleted_at IS NULL`
                      : sql`AND c.deleted_at IS NOT NULL`
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
        GROUP BY c.id
        ${
            order
                ? sql.unsafe(
                      getOrderByClause({
                          order,
                          map: {
                              updatedAt: 'c.updated_at',
                              name: 'c.name',
                              valueType: 'c.value_type',
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
        data: query.map(formatFromDatabase),
        page,
        limit,
    }
}
