import { IncludeDatabaseDates, QuotePricingOption } from '@novadmin/lib/types'
import {
    createPostgresClient,
    generateGeneralFuzzyClause,
    getEntityFuzzyFields,
    getOrderByClause,
    validateListParams,
} from '..'
import {
    DatabaseQuotePricingOption,
    formatFromDatabase,
    QuotePricingOptionFuzzyFields,
} from '.'
import { ActivationStatusFilter } from '@novadmin/lib/types'
import { Sql } from 'postgres'

export type OrderOptions = 'updatedAt' | 'createdAt' | 'name'

export const defaultOrderOption: OrderOptions = 'createdAt'

export const list = async (params: {
    sql?: Sql
    id?: string
    generalFuzzy?: {
        value?: string
        fields?: QuotePricingOptionFuzzyFields[]
    }
    order?: OrderOptions
    activationStatus: ActivationStatusFilter
    page: number
    limit: number
}): Promise<{
    data: IncludeDatabaseDates<QuotePricingOption>[]
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
            tablePrefix: 'po.',
        })

    const query = await sql<
        (DatabaseQuotePricingOption & { total_count: number })[]
    >`
        SELECT 
            po.*,
            COUNT(*) OVER() AS total_count
        FROM quote_pricing_option po
        WHERE 1 = 1 
            ${id ? sql`AND po.id = ${id}` : sql``}
            ${
                activationStatus === 'all'
                    ? sql``
                    : activationStatus === 'active'
                      ? sql`AND po.deleted_at IS NULL`
                      : sql`AND po.deleted_at IS NOT NULL`
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
        GROUP BY po.id
        ${
            order
                ? sql.unsafe(
                      getOrderByClause({
                          order,
                          map: {
                              updatedAt: 'po.updated_at',
                              createdAt: 'po.created_at',
                              name: 'po.name',
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
