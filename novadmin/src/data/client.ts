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
    Client,
    OptionalId,
    DatabaseKeys,
    IncludeDatabaseDates,
} from '@novadmin/lib/types'

export type DatabaseClient = DatabaseKeys<IncludeDatabaseDates<Client>>

export const formatFromDatabase = (
    client: DatabaseClient
): IncludeDatabaseDates<Client> => {
    const newClient: IncludeDatabaseDates<Client> & DatabaseClient = {
        ...client,
        zipCode: client.zipcode,
        createdAt: client.createdat,
        updatedAt: client.updatedat,
        deletedAt: client.deletedat,
    }
    delete (newClient as any).total_count
    delete (newClient as any).zipcode
    delete (newClient as any).createdat
    delete (newClient as any).updatedat
    delete (newClient as any).deletedat
    return newClient
}

export type OrderOptions = 'updatedAt' | 'name' | 'city' | 'state'

export const list = async (params: {
    id?: number
    generalFuzzy?: {
        value?: string
        fields?: Array<
            'name' | 'address' | 'city' | 'state' | 'zipCode' | 'phone'
        >
    }
    fuzzy?: {
        name?: string
        address?: string
        city?: string
        state?: string
        zipCode?: string
        phone?: string
    }
    order?: OrderOptions
    includeDeleted: boolean
    page: number
    limit: number
}): Promise<{
    data: IncludeDatabaseDates<Client>[]
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
        page,
        generalFuzzy,
        fuzzy,
        limit,
        includeDeleted,
        order = 'updatedAt_desc',
    } = params

    const sql = createPostgresClient()

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

    const query = await sql<(DatabaseClient & { total_count: number })[]>`
        SELECT 
            *,
            COUNT(*) OVER() AS total_count
        FROM client WHERE 1 = 1 ${id ? sql`AND id = ${id}` : sql``}
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
        ${
            order
                ? sql.unsafe(
                      getOrderByClause({
                          order,
                          map: {
                              updatedAt: 'updatedat',
                              name: 'name',
                              city: 'city',
                              state: 'state',
                          },
                          default: 'updatedAt_desc',
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

export const upsert = async ({ record }: { record: OptionalId<Client> }) => {
    try {
        validateUpsertParams(record)

        const sql = createPostgresClient()

        const query = await sql<DatabaseClient[]>`
            INSERT INTO client (id, name, address, city, state, zipCode, phone)
            VALUES (
                ${record.id ?? sql`DEFAULT`},
                ${record.name},
                ${record.address ?? sql`DEFAULT`},
                ${record.city ?? sql`DEFAULT`},
                ${record.state ?? sql`DEFAULT`},
                ${record.zipCode ?? sql`DEFAULT`},
                ${record.phone ?? sql`DEFAULT`}
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                address = EXCLUDED.address,
                city = EXCLUDED.city,
                state = EXCLUDED.state,
                zipCode = EXCLUDED.zipCode,
                phone = EXCLUDED.phone
            RETURNING *;
        `
        await sql.end()

        return query.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error upserting client:', error)
        throw error
    }
}

export const remove = async ({ id }: { id: string }) => {
    try {
        const sql = createPostgresClient()

        const query = await sql<DatabaseClient[]>`
            UPDATE client SET deletedAt = NOW() WHERE id = ${id} RETURNING *;
        `
        await sql.end()

        return query.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error soft deleting client:', error)
        throw error
    }
}
