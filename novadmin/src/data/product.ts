import { Sql } from 'postgres'
import {
    convertIfPostgresError,
    createPostgresClient,
    generateGeneralFuzzyClause,
    generateSpecificFuzzyClause,
    getOrderByClause,
    validateListParams,
    validateUpsertParams,
} from './index'
import {
    DatabaseKeys,
    IncludeDatabaseDates,
    Product,
    SnakeCaseKeys,
} from '@novadmin/lib/types'

export type DatabaseProduct = DatabaseKeys<
    SnakeCaseKeys<Omit<Product, 'createdAt' | 'updatedAt' | 'deletedAt'>>
> & {
    createdat: Date
    updatedat: Date
    deletedat?: Date | null
}

export const formatFromDatabase = (
    product: DatabaseProduct
): IncludeDatabaseDates<Product> => {
    const newProduct: IncludeDatabaseDates<Product> & DatabaseProduct = {
        ...product,
        typeOnQuote: product.type_on_quote,
        commercialPercentage: Number(product.commercial_percentage),
        projectPercentage: Number(product.project_percentage),
        consumptionRates: product.consumption_rates,
        createdAt: product.createdat,
        updatedAt: product.updatedat,
        deletedAt: product.deletedat,
    }
    delete (newProduct as any).total_count
    delete (newProduct as any).type_on_quote
    delete (newProduct as any).commercial_percentage
    delete (newProduct as any).project_percentage
    delete (newProduct as any).consumption_rates
    delete (newProduct as any).createdat
    delete (newProduct as any).updatedat
    delete (newProduct as any).deletedat
    return newProduct
}

export type OrderOptions = 'updatedAt' | 'name' | 'shorthand'

export const list = async (params: {
    sql?: Sql
    id?: number
    generalFuzzy?: {
        value?: string
        fields?: Array<'name' | 'description' | 'shorthand'>
    }
    fuzzy?: {
        name?: string
        description?: string
        shorthand?: string
    }
    order?: OrderOptions
    includeDeleted: boolean
    page: number
    limit: number
}): Promise<{
    data: IncludeDatabaseDates<Product>[]
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
        generalFuzzy,
        fuzzy,
        limit,
        includeDeleted,
        order = 'updatedAt_desc',
    } = params

    const sql = outsideSql ?? createPostgresClient()

    const { hasGeneralFuzzy, generalFuzzyClause } = generateGeneralFuzzyClause({
        sql,
        fields: generalFuzzy?.fields ?? [],
        value: generalFuzzy?.value ?? '',
    })

    const { hasSpecificFuzzy, specificFuzzyClause } =
        generateSpecificFuzzyClause({
            sql,
            fields: fuzzy ?? {},
        })

    const query = await sql<(DatabaseProduct & { total_count: number })[]>`
        SELECT 
            *,
            COUNT(*) OVER() AS total_count
        FROM product WHERE 1 = 1 ${id ? sql`AND id = ${id}` : sql``}
        ${
            hasGeneralFuzzy
                ? sql`AND ( 
                    ${generalFuzzyClause}
                )
            `
                : sql``
        }
        ${
            hasSpecificFuzzy
                ? sql`AND ( 
                    ${specificFuzzyClause}
                )
            `
                : sql``
        }
        ${includeDeleted ? sql`` : sql`AND deletedAt IS NULL`}
        ${sql.unsafe(
            getOrderByClause({
                order,
                map: {
                    updatedAt: 'updatedAt',
                    name: 'name',
                    shorthand: 'shorthand',
                },
                default: 'updatedAt_desc',
            })
        )}
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

export const upsert = async ({ record }: { record: Product }) => {
    try {
        validateUpsertParams(record)

        const sql = createPostgresClient()

        const query = await sql<DatabaseProduct[]>`
            INSERT INTO product (
                id,
                name,
                description,
                shorthand,
                type_on_quote,
                commercial_percentage,
                project_percentage,
                modifiers,
                consumption_rates
            )
            VALUES (
                ${record.id ?? sql`DEFAULT`},
                ${record.name},
                ${record.description ?? sql`DEFAULT`},
                ${record.shorthand ?? sql`DEFAULT`},
                ${record.typeOnQuote ?? sql`DEFAULT`},
                ${record.commercialPercentage ?? sql`DEFAULT`},
                ${record.projectPercentage ?? sql`DEFAULT`},
                '${sql.unsafe(JSON.stringify(record.modifiers))}'::jsonb,
                '${sql.unsafe(JSON.stringify(record.consumptionRates))}'::jsonb
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                shorthand = EXCLUDED.shorthand,
                type_on_quote = EXCLUDED.type_on_quote,
                modifiers = EXCLUDED.modifiers,
                commercial_percentage = EXCLUDED.commercial_percentage,
                project_percentage = EXCLUDED.project_percentage,
                consumption_rates = EXCLUDED.consumption_rates
            RETURNING *;
        `
        await sql.end()

        return query.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error upserting product:', error)
        throw error
    }
}

export const remove = async ({ id }: { id: string }) => {
    try {
        const sql = createPostgresClient()

        const query = await sql<DatabaseProduct[]>`
            UPDATE product SET deletedAt = NOW() WHERE id = ${id} RETURNING *;
        `
        await sql.end()

        return query.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error soft deleting product:', error)
        throw error
    }
}
