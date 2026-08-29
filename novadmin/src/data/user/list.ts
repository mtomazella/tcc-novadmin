import { IncludeOptionalPassword, User } from '@novadmin/lib/types'
import { ActivationStatusFilter } from '@novadmin/lib/types'
import {
    createPostgresClient,
    generateGeneralFuzzyClause,
    generateSpecificFuzzyClause,
    getOrderByClause,
    validateListParams,
} from '..'
import { DatabaseUser, formatFromDatabase } from '.'

export type OrderOptions = 'updatedAt' | 'name' | 'role' | 'email'

export const list = async (params: {
    id?: number
    generalFuzzy?: {
        value?: string
        fields?: Array<'name' | 'role' | 'email'>
    }
    fuzzy?: {
        name?: string
        role?: string
        email?: string
    }
    includePermissions?: boolean
    includePassword?: boolean
    activationStatus: ActivationStatusFilter
    order?: OrderOptions
    page: number
    limit: number
}): Promise<{
    data: IncludeOptionalPassword<User>[]
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
        includePermissions,
        includePassword,
        activationStatus,
        order,
    } = params

    const sql = createPostgresClient()

    const { hasGeneralFuzzy, generalFuzzyClause } = generateGeneralFuzzyClause({
        sql,
        fields: generalFuzzy?.fields ?? [],
        value: generalFuzzy?.value ?? '',
        tablePrefix: 'u.',
    })

    const { hasSpecificFuzzy, specificFuzzyClause } =
        generateSpecificFuzzyClause({
            sql,
            fields: fuzzy ?? {},
            tablePrefix: 'u.',
        })

    const query = await sql<(DatabaseUser & { total_count: number })[]>`
        SELECT  
            u.id,
            u.name,
            u.role,
            u.email,
            ${includePassword ? sql`u.password,` : sql``}
            u.createdAt,
            u.updatedAt,
            u.deletedAt,
            COUNT(*) OVER() AS total_count
            ${
                includePermissions
                    ? sql`
                    ,
                    ARRAY_REMOVE(ARRAY_AGG(p.id), NULL) AS permissions
                `
                    : sql``
            }
        FROM "user" u 
        ${
            includePermissions
                ? sql`
                LEFT JOIN user_permission up ON up.userId = u.id
                LEFT JOIN permission p ON p.id = up.permissionId
            `
                : sql``
        }
        WHERE 1 = 1 
            ${id ? sql`AND u.id = ${id}` : sql``}
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
            ${
                activationStatus === 'all'
                    ? sql``
                    : activationStatus === 'active'
                      ? sql`AND u.deletedAt IS NULL`
                      : sql`AND u.deletedAt IS NOT NULL`
            }
        ${
            includePermissions
                ? sql`
                GROUP BY u.id
            `
                : sql``
        }
        ${
            order
                ? sql.unsafe(
                      getOrderByClause({
                          order,
                          map: {
                              updatedAt: 'u.updatedAt',
                              name: 'u.name',
                              role: 'u.role',
                              email: 'u.email',
                          },
                          default: 'u.updatedAt',
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
