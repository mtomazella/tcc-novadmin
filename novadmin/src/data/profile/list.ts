import { IncludeDatabaseDates, Profile } from '@novadmin/lib/types'

import {
    createPostgresClient,
    generateGeneralFuzzyClause,
    getEntityFuzzyFields,
    getOrderByClause,
    validateListParams,
} from '..'
import { DatabaseProfile, formatFromDatabase, ProfileFuzzyFields } from '.'

export type OrderOptions = 'updatedAt' | 'name'

export const defaultOrderOption: OrderOptions = 'updatedAt'

export const list = async (params: {
    id?: number
    generalFuzzy?: {
        value?: string
        fields?: Array<ProfileFuzzyFields>
    }
    order?: OrderOptions
    page: number
    limit: number
}): Promise<{
    data: IncludeDatabaseDates<Profile>[]
    count: {
        page: number
        total: number
    }
    page: number
    limit: number
}> => {
    validateListParams(params)

    const { id, page, limit, generalFuzzy, order = defaultOrderOption } = params

    const sql = createPostgresClient()

    const { hasGeneralFuzzy, stringGeneralFuzzyClause } =
        generateGeneralFuzzyClause({
            sql,
            fields: getEntityFuzzyFields(generalFuzzy?.fields, ''),
            value: generalFuzzy?.value ?? '',
            tablePrefix: 'p.',
        })

    const query = await sql<(DatabaseProfile & { total_count: number })[]>`
        SELECT
            p.*,
            COUNT(*) OVER() AS total_count,
            COALESCE(
                JSON_AGG(DISTINCT pp.permissionId) FILTER (WHERE pp.permissionId IS NOT NULL),
                '[]'::json
            ) AS permissions
        FROM profile p
            LEFT JOIN profile_permission pp ON pp.profileId = p.id
        WHERE p.deletedAt IS NULL
            ${id ? sql`AND p.id = ${id}` : sql``}
            ${
                hasGeneralFuzzy
                    ? sql.unsafe(`AND ( ${stringGeneralFuzzyClause} )`)
                    : sql``
            }
        GROUP BY p.id
        ${
            order
                ? sql.unsafe(
                      getOrderByClause({
                          order,
                          map: {
                              updatedAt: 'p.updatedAt',
                              name: 'p.name',
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
