import { ActivationStatusFilter, IncludeDatabaseDates, User } from '@novadmin/lib/types'
import {
    createPostgresClient,
    generateGeneralFuzzyClause,
    getEntityFuzzyFields,
    getOrderByClause,
    validateListParams,
} from '..'
import { DatabaseUser, formatFromDatabase, UserFuzzyFields } from '.'

export type OrderOptions = 'updatedAt' | 'name' | 'role' | 'email'

export const defaultOrderOption: OrderOptions = 'updatedAt'

export const list = async (params: {
    id?: number
    profileId?: number
    generalFuzzy?: {
        value?: string
        fields?: Array<UserFuzzyFields>
    }
    includePermissions?: boolean
    activationStatus: ActivationStatusFilter
    order?: OrderOptions
    page: number
    limit: number
}): Promise<{
    data: IncludeDatabaseDates<User>[]
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
        profileId,
        page,
        limit,
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
            tablePrefix: 'u.',
        })

    const query = await sql<(DatabaseUser & { total_count: number })[]>`
        SELECT
            u.id,
            u.name,
            u.email,
            u.role,
            u.profileId,
            p.name AS profileName,
            u.isAdmin,
            u.createdAt,
            u.updatedAt,
            u.deletedAt,
            COUNT(*) OVER() AS total_count,
            COALESCE(
                JSON_AGG(DISTINCT up.permissionId) FILTER (WHERE up.permissionId IS NOT NULL),
                '[]'::json
            ) AS permissions
        FROM "user" u
            LEFT JOIN profile p ON p.id = u.profileId
            LEFT JOIN user_permission up ON up.userId = u.id
        WHERE 1 = 1
            ${id ? sql`AND u.id = ${id}` : sql``}
            ${profileId ? sql`AND u.profileId = ${profileId}` : sql``}
            ${
                activationStatus === 'all'
                    ? sql``
                    : activationStatus === 'active'
                      ? sql`AND u.deletedAt IS NULL`
                      : sql`AND u.deletedAt IS NOT NULL`
            }
            ${
                hasGeneralFuzzy
                    ? sql.unsafe(`AND ( ${stringGeneralFuzzyClause} )`)
                    : sql``
            }
        GROUP BY u.id, p.name
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
