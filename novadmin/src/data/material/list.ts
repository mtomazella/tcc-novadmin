import {
    IncludeDatabaseDates,
    Material,
    MaterialType,
} from '@novadmin/lib/types'
import {
    createPostgresClient,
    generateGeneralFuzzyClause,
    getEntityFuzzyFields,
    getOrderByClause,
    validateListParams,
} from '..'
import { DatabaseMaterial, formatFromDatabase, MaterialFuzzyFields } from '.'
import { ActivationStatusFilter } from '@novadmin/lib/types'

export type OrderOptions =
    | 'updatedAt'
    | 'sku'
    | 'name'
    | 'type'
    | 'value'
    | 'supplierId'

export const defaultOrderOption: OrderOptions = 'sku'

export const list = async (params: {
    id?: number
    supplierId?: number
    type?: MaterialType
    generalFuzzy?: {
        value?: string
        fields?: Array<MaterialFuzzyFields>
    }
    includeSupplier?: boolean
    activationStatus: ActivationStatusFilter
    order?: OrderOptions
    page: number
    limit: number
}): Promise<{
    data: IncludeDatabaseDates<Material>[]
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
        supplierId,
        type,
        page,
        limit,
        includeSupplier,
        activationStatus,
        generalFuzzy,
        order = defaultOrderOption,
    } = params

    const sql = createPostgresClient()

    const { hasGeneralFuzzy, stringGeneralFuzzyClause } =
        generateGeneralFuzzyClause({
            sql,
            fields: getEntityFuzzyFields(generalFuzzy?.fields, ''),
            value: generalFuzzy?.value ?? '',
            tablePrefix: 'm.',
        })

    const {
        hasGeneralFuzzy: hasSupplierGeneralFuzzy,
        stringGeneralFuzzyClause: supplierGeneralFuzzyClause,
    } = generateGeneralFuzzyClause({
        sql,
        fields: getEntityFuzzyFields(generalFuzzy?.fields, 'supplier'),
        value: generalFuzzy?.value ?? '',
        tablePrefix: 's.',
    })

    const query = await sql<(DatabaseMaterial & { total_count: number })[]>`
        SELECT 
            m.*,
            COUNT(*) OVER() AS total_count
            ${
                includeSupplier
                    ? sql`
                        , row_to_json(s) as supplier
                    `
                    : sql``
            }
        FROM material m
            LEFT JOIN supplier s ON s.id = m.supplier_id
        WHERE 1 = 1 
            ${id ? sql`AND m.id = ${id}` : sql``}
            ${supplierId ? sql`AND s.id = ${supplierId}` : sql``}
            ${type ? sql`AND m.type = ${type}` : sql``}
            ${
                activationStatus === 'all'
                    ? sql``
                    : activationStatus === 'active'
                      ? sql`AND m.deleted_at IS NULL`
                      : sql`AND m.deleted_at IS NOT NULL`
            }
            ${
                hasGeneralFuzzy || hasSupplierGeneralFuzzy
                    ? sql.unsafe(`AND ( 
                        ${[stringGeneralFuzzyClause, supplierGeneralFuzzyClause]
                            .filter((c) => c)
                            .join(' OR ')}
                    )`)
                    : sql``
            }
        GROUP BY m.id, s.id
        ${
            order
                ? sql.unsafe(
                      getOrderByClause({
                          order,
                          map: {
                              updatedAt: 'm.updated_at',
                              sku: 'm.sku',
                              name: 'm.name',
                              type: 'm.type',
                              value: 'm.value',
                              supplierId: 's.id',
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
