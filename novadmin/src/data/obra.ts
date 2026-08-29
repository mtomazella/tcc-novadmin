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
    OptionalId,
    DatabaseKeys,
    IncludeDatabaseDates,
    Obra,
} from '@novadmin/lib/types'
import {
    DatabaseClient,
    formatFromDatabase as formatClientFromDatabase,
} from './client'

export type DatabaseObra = DatabaseKeys<IncludeDatabaseDates<Obra>> & {
    client?: DatabaseClient
}

export const formatFromDatabase = (
    obra: DatabaseObra
): IncludeDatabaseDates<Obra> => {
    const newRecord: DatabaseObra & IncludeDatabaseDates<Obra> = {
        ...obra,
        addressComplement: obra.addresscomplement,
        clientId: obra.clientid,
        createdAt: obra.createdat,
        updatedAt: obra.updatedat,
        deletedAt: obra.deletedat,
    }

    if (obra.client) {
        ;(newRecord as any).client = formatClientFromDatabase(obra.client)
    }

    if (obra.clientdeleted !== undefined) {
        newRecord.clientDeleted = obra.clientdeleted
    }

    delete (newRecord as any).clientdeleted
    delete (newRecord as any).addresscomplement
    delete (newRecord as any).clientid
    delete (newRecord as any).total_count
    delete (newRecord as any).createdat
    delete (newRecord as any).updatedat
    delete (newRecord as any).deletedat
    return newRecord
}

export type OrderOptions = 'updatedAt' | 'name'

export const list = async (params: {
    id?: number
    generalFuzzy?: {
        value?: string
        fields?: Array<
            | 'name'
            | 'description'
            | 'phone'
            | 'email'
            | 'address'
            | 'addressComplement'
            | 'contact'
        >
    }
    fuzzy?: {
        name?: string
        description?: string
        phone?: string
        email?: string
        address?: string
        addressComplement?: string
        contact?: string
    }
    order?: OrderOptions
    includeClient: boolean
    includeDeleted: boolean
    page: number
    limit: number
}): Promise<{
    data: IncludeDatabaseDates<Obra>[]
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
        order,
        includeClient,
        includeDeleted,
    } = params

    const sql = createPostgresClient()

    const { hasGeneralFuzzy, generalFuzzyClause } = generateGeneralFuzzyClause({
        sql,
        fields: generalFuzzy?.fields ?? [],
        value: generalFuzzy?.value ?? '',
        tablePrefix: 'o.',
    })

    const { hasSpecificFuzzy, specificFuzzyClause } =
        generateSpecificFuzzyClause({
            sql,
            fields: fuzzy ?? {},
            tablePrefix: 'o.',
        })

    const query = await sql<(DatabaseObra & { total_count: number })[]>`
        SELECT 
            o.*,
            COUNT(*) OVER() AS total_count,
            (
                o.clientid IS NULL OR (
                    select c.deletedat is not null from client c where id = o.clientid
                )
            ) as clientDeleted
            ${
                includeClient
                    ? sql`
                        , row_to_json(c) as client
                    `
                    : sql``
            }
        FROM obra o
        ${
            includeClient
                ? sql`
                    LEFT JOIN client c ON c.id = o.clientid
                `
                : sql``
        }
        WHERE 1 = 1 
            ${id ? sql`AND o.id = ${id}` : sql``}
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
            ${includeDeleted ? sql`` : sql`AND o.deletedAt IS NULL`}
        ${
            order
                ? sql.unsafe(
                      getOrderByClause({
                          order,
                          map: {
                              updatedAt: 'o.updatedAt',
                              name: 'o.name',
                          },
                          default: 'updatedAt',
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

export const upsert = async ({ record }: { record: OptionalId<Obra> }) => {
    try {
        validateUpsertParams(record)

        const sql = createPostgresClient()

        const query = await sql<DatabaseObra[]>`
            INSERT INTO obra (id, name, description, phone, email, address, addressComplement, contact, clientId)
            VALUES (
                ${record.id ?? sql`DEFAULT`},
                ${record.name},
                ${record.description ?? sql`DEFAULT`},
                ${record.phone ?? sql`DEFAULT`},
                ${record.email ?? sql`DEFAULT`},
                ${record.address ?? sql`DEFAULT`},
                ${record.addressComplement ?? sql`DEFAULT`},
                ${record.contact ?? sql`DEFAULT`},
                ${record.clientId ?? sql`DEFAULT`}
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                phone = EXCLUDED.phone,
                email = EXCLUDED.email,
                address = EXCLUDED.address,
                addressComplement = EXCLUDED.addressComplement,
                contact = EXCLUDED.contact,
                clientId = EXCLUDED.clientId
            RETURNING *;
        `
        await sql.end()

        return query.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error upserting obra:', error)
        throw error
    }
}

export const remove = async ({ id }: { id: string }) => {
    try {
        const sql = createPostgresClient()

        const query = await sql<DatabaseObra[]>`
            UPDATE obra SET deletedAt = NOW() WHERE id = ${id} RETURNING *;
        `
        await sql.end()

        return query.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error soft deleting obra:', error)
        throw error
    }
}
