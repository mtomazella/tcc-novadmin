import { IncludeDatabaseDates, Supplier } from '@novadmin/lib/types'
import {
    createPostgresClient,
    generateGeneralFuzzyClause,
    getEntityFuzzyFields,
    getOrderByClause,
    validateListParams,
} from '..'
import { DatabaseSupplier, formatFromDatabase, SupplierFuzzyFields } from '.'
import { ActivationStatusFilter } from '@novadmin/lib/types'

export type OrderOptions = 'updatedAt' | 'name'

export const defaultOrderOption: OrderOptions = 'updatedAt'

export const list = async (params: {
    id?: number
    materialId?: number
    materialSkus?: string[]
    generalFuzzy?: {
        value?: string
        fields?: Array<SupplierFuzzyFields>
    }
    includeMaterials?: boolean
    activationStatus: ActivationStatusFilter
    materialActivationStatus?: ActivationStatusFilter
    order?: OrderOptions
    page: number
    limit: number
}): Promise<{
    data: IncludeDatabaseDates<Supplier>[]
    count: {
        page: number
        total: number
    }
    page: number
    limit: number
}> => {
    validateListParams(params)

    const {
        id,
        materialId,
        materialSkus,
        includeMaterials,
        page,
        limit,
        activationStatus,
        materialActivationStatus,
        generalFuzzy,
        order = defaultOrderOption,
    } = params

    const sql = createPostgresClient()

    const { hasGeneralFuzzy, stringGeneralFuzzyClause } =
        generateGeneralFuzzyClause({
            sql,
            fields: getEntityFuzzyFields(generalFuzzy?.fields, ''),
            value: generalFuzzy?.value ?? '',
            tablePrefix: 's.',
        })

    const {
        hasGeneralFuzzy: hasMaterialGeneralFuzzy,
        stringGeneralFuzzyClause: materialGeneralFuzzyClause,
    } = generateGeneralFuzzyClause({
        sql,
        fields: getEntityFuzzyFields(generalFuzzy?.fields, 'material'),
        value: generalFuzzy?.value ?? '',
        tablePrefix: 'm.',
    })

    const query = await sql<(DatabaseSupplier & { total_count: number })[]>`
        SELECT 
            s.*,
            COUNT(*) OVER() AS total_count
            ${
                includeMaterials
                    ? sql`
                        , COALESCE(
                            JSON_AGG(DISTINCT to_jsonb(m)) FILTER (WHERE m.id IS NOT NULL),
                            '[]'::json
                        ) AS materials
                    `
                    : sql``
            }
        FROM supplier s
            LEFT JOIN material m ON m.supplier_id = s.id ${
                materialActivationStatus === 'all'
                    ? sql``
                    : materialActivationStatus === 'active'
                      ? sql`AND m.deleted_at IS NULL`
                      : sql`AND m.deleted_at IS NOT NULL`
            }
        WHERE 1 = 1 
            ${id ? sql`AND s.id = ${id}` : sql``}
            ${materialId ? sql`AND m.id = ${materialId}` : sql``}
            ${(materialSkus ?? []).length ? sql`AND m.sku = ANY(${materialSkus ?? []})` : sql``}
            ${
                activationStatus === 'all'
                    ? sql``
                    : activationStatus === 'active'
                      ? sql`AND s.deleted_at IS NULL`
                      : sql`AND s.deleted_at IS NOT NULL`
            }
            ${
                hasGeneralFuzzy || hasMaterialGeneralFuzzy
                    ? sql.unsafe(`AND ( 
                        ${[stringGeneralFuzzyClause, materialGeneralFuzzyClause]
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
                              name: 's.name',
                          },
                          default: defaultOrderOption,
                      })
                  )
                : sql``
        }
        LIMIT ${limit} OFFSET ${(page - 1) * limit};
    `
    await sql.end()

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
