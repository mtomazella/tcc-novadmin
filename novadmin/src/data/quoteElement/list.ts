import {
    IncludeDatabaseDates,
    QuoteElement,
    QuoteElementType,
} from '@novadmin/lib/types'
import {
    createPostgresClient,
    generateGeneralFuzzyClause,
    getEntityFuzzyFields,
    getOrderByClause,
    validateListParams,
} from '..'
import {
    DatabaseQuoteElement,
    formatFromDatabase,
    QuoteElementFuzzyFields,
} from '.'
import { ActivationStatusFilter } from '@novadmin/lib/types'
import { Sql } from 'postgres'

export type OrderOptions =
    | 'updatedAt'
    | 'createdAt'
    | 'productId'
    | 'scopeId'
    | 'name'
    | 'type'

export const defaultOrderOption: OrderOptions = 'name'

export const list = async (params: {
    sql?: Sql
    id?: number
    quoteId?: number
    scopeId?: number
    productId?: number
    type?: QuoteElementType
    generalFuzzy?: {
        value?: string
        fields?: Array<QuoteElementFuzzyFields>
    }
    includeProductName?: boolean
    includeProduct?: boolean
    includeScope?: boolean
    activationStatus: ActivationStatusFilter
    order?: OrderOptions
    page: number
    limit: number
}): Promise<{
    data: IncludeDatabaseDates<QuoteElement>[]
    count: {
        page: number
        total: number
        category: Record<string, number>
    }
    page: number
    limit: number
}> => {
    validateListParams(params)

    const {
        sql: outsideSql,
        id,
        quoteId,
        scopeId,
        productId,
        type,
        page,
        limit,
        includeProductName,
        includeProduct,
        includeScope,
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
            tablePrefix: 'e.',
        })

    const query = await sql<
        (DatabaseQuoteElement & {
            total_count: number
            category_counts: Record<string, number>
        })[]
    >`
        WITH filtered_elements AS (
            SELECT 
                e.*,
                e.type || '+' || e.product_id || COALESCE(
                    '+' || NULLIF(array_to_string(
                        ARRAY[
                            CASE WHEN (e.values->>'cambotado')::boolean THEN 'cambotado' END,
                            CASE WHEN (e.values->>'needsGastalho')::boolean THEN 'needsGastalho' END,
                            CASE WHEN (e.values->>'ripado')::boolean THEN 'ripado' END,
                            CASE WHEN (e.values->>'aparente')::boolean THEN 'aparente' END,
                            CASE WHEN (e.values->>'paginado')::boolean THEN 'paginado' END,
                            CASE WHEN (e.values->>'needsGarfo')::boolean THEN 'needsGarfo' END,
                            CASE WHEN (e.values->>'garfo')::boolean THEN 'garfo' END,
                            CASE WHEN (e.values->>'gastalho')::boolean THEN 'gastalho' END,
                            CASE WHEN (e.values->>'fundoDeViga')::boolean THEN 'fundoDeViga' END
                        ],
                        '+'
                    ), ''),
                    ''
                ) as category
                ${includeProductName ? sql`, p.name as product_name` : sql``}
                ${includeProduct ? sql`, row_to_json(p) as product` : sql``}
                ${includeScope ? sql`, row_to_json(s) as scope` : sql``}
            FROM quote_element e
                LEFT JOIN product p ON p.id = e.product_id
                ${includeScope ? sql`LEFT JOIN quote_scope s ON s.id = e.scope_id` : sql``}
            WHERE 1 = 1 
                ${id ? sql`AND e.id = ${id}` : sql``}
                ${quoteId ? sql`AND e.quote_id = ${quoteId}` : sql``}
                ${scopeId ? sql`AND e.scope_id = ${scopeId}` : sql``}
                ${productId ? sql`AND e.product_id = ${productId}` : sql``}
                ${type ? sql`AND e.type = ${type}` : sql``}
                ${
                    activationStatus === 'all'
                        ? sql``
                        : activationStatus === 'active'
                          ? sql`AND e.deleted_at IS NULL`
                          : sql`AND e.deleted_at IS NOT NULL`
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
        ),
        category_aggregates AS (
            SELECT 
                json_object_agg(category, category_count) as category_counts
            FROM (
                SELECT category, COUNT(*) as category_count
                FROM filtered_elements
                GROUP BY category
            ) counts
        )
        SELECT 
            fe.*,
            COUNT(*) OVER() AS total_count,
            ca.category_counts as category_counts
        FROM filtered_elements fe
        CROSS JOIN category_aggregates ca
        ${
            order
                ? sql.unsafe(
                      getOrderByClause({
                          order,
                          map: {
                              updatedAt: 'fe.updated_at',
                              createdAt: 'fe.created_at',
                              productId: 'fe.product_id',
                              scopeId: 'fe.scope_id',
                              name: 'fe.name',
                              type: 'fe.type',
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
            category: query[0]?.category_counts ?? {},
        },
        data: query.map(formatFromDatabase),
        page,
        limit,
    }
}
