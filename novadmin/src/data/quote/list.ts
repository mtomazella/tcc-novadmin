import {
    IncludeDatabaseDates,
    Quote,
    QuoteVersionType,
} from '@novadmin/lib/types'
import {
    createPostgresClient,
    generateGeneralFuzzyClause,
    getEntityFuzzyFields,
    getOrderByClause,
    validateListParams,
} from '..'
import { DatabaseQuote, formatFromDatabase, QuoteFuzzyField } from '.'
import { ActivationStatusFilter } from '@novadmin/lib/types'
import { Sql, TransactionSql } from 'postgres'

export type OrderOptions =
    | 'updatedAt'
    | 'createdAt'
    | 'quoteNumber'
    | 'client_name'
    | 'obra_name'

export const defaultOrderOption: OrderOptions = 'quoteNumber'

export type RootStatus =
    | 'onlyRoots'
    | 'rootsAndAdditions'
    | 'onlyLeaves'
    | 'all'
export const RootStatuses: RootStatus[] = [
    'onlyRoots',
    'rootsAndAdditions',
    'onlyLeaves',
    'all',
]

export const list = async (params: {
    sql?: Sql | TransactionSql
    id?: number
    parentId?: number
    rootId?: number
    versionType?: QuoteVersionType
    clientId?: number
    obraId?: number
    createdByUserId?: number
    quoteNumber?: string
    revisionNumber?: number
    additionNumber?: number
    yearCode?: number
    rootStatus?: RootStatus
    generalFuzzy?: {
        value?: string
        fields?: Array<QuoteFuzzyField>
    }
    includeVersionSummary?: boolean
    includeClient?: boolean
    includeObra?: boolean
    activationStatus: ActivationStatusFilter
    order?: OrderOptions
    page: number
    limit: number
    userId?: number
}): Promise<{
    data: IncludeDatabaseDates<Quote>[]
    count: {
        page: number
        total: number
    }
    page: number
    limit: number
    userId?: number
}> => {
    validateListParams(params)

    const {
        sql: outsideSql,
        id,
        parentId,
        rootId,
        versionType,
        clientId,
        obraId,
        createdByUserId,
        quoteNumber,
        revisionNumber,
        additionNumber,
        yearCode,
        rootStatus,
        includeVersionSummary,
        includeClient,
        includeObra,
        page,
        limit,
        activationStatus,
        generalFuzzy,
        order = defaultOrderOption,
        userId,
    } = params

    const sql = outsideSql ?? createPostgresClient()

    const { hasGeneralFuzzy, stringGeneralFuzzyClause } =
        generateGeneralFuzzyClause({
            sql,
            fields: getEntityFuzzyFields(generalFuzzy?.fields, ''),
            value: generalFuzzy?.value ?? '',
            tablePrefix: 'q.',
        })

    const {
        hasGeneralFuzzy: hasClientGeneralFuzzy,
        stringGeneralFuzzyClause: stringClientGeneralFuzzyClause,
    } = generateGeneralFuzzyClause({
        sql,
        fields: getEntityFuzzyFields(generalFuzzy?.fields, ''),
        value: generalFuzzy?.value ?? '',
        tablePrefix: 'c.',
    })

    const {
        hasGeneralFuzzy: hasObraGeneralFuzzy,
        stringGeneralFuzzyClause: stringObraGeneralFuzzyClause,
    } = generateGeneralFuzzyClause({
        sql,
        fields: getEntityFuzzyFields(generalFuzzy?.fields, ''),
        value: generalFuzzy?.value ?? '',
        tablePrefix: 'o.',
    })

    // Whether a row counts as a candidate for "most recent version" (is_leaf,
    // onlyLeaves) depends on the same activationStatus the caller queried
    // with: excluding deleted rows only makes sense if the fetch itself
    // excludes them, otherwise a deleted row can still legitimately be "the
    // leaf" from an all-records point of view.
    const leafCandidateDeletedAtClause = (alias: 'q2' | 'q3') => {
        if (activationStatus === 'active') {
            return sql`AND ${sql.unsafe(alias)}.deleted_at IS NULL`
        } else if (activationStatus === 'deleted') {
            return sql`AND ${sql.unsafe(alias)}.deleted_at IS NOT NULL`
        }
        return sql``
    }

    const query = await sql<(DatabaseQuote & { total_count: number })[]>`
        SELECT
            q.*,
            ${includeClient ? sql`row_to_json(c.*) AS client,` : sql``}
            ${includeObra ? sql`row_to_json(o.*) AS obra,` : sql``}
            ${
                includeVersionSummary
                    ? sql`
                        (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'id', q2.id,
                                    'parentId', q2.parent_id,
                                    'versionType', q2.version_type,
                                    'quoteNumber', q2.quote_number,
                                    'revisionNumber', q2.revision_number,
                                    'additionNumber', q2.addition_number,
                                    'yearCode', q2.year_code,
                                    'createdAt', q2.created_at,
                                    'createdByUserId', q2.created_by_user_id
                                )
                                ORDER BY q2.created_at ASC
                            )
                            FROM quote AS q2
                            WHERE (q2.root_id = q.root_id) ${leafCandidateDeletedAtClause('q2')}
                        ) AS version_summary,
                    `
                    : sql``
            }
            q.root_id = q.id AS is_root,
            (
                SELECT id FROM quote AS q3
                WHERE q3.root_id = q.root_id ${leafCandidateDeletedAtClause('q3')}
                ORDER BY q3.created_at DESC LIMIT 1
            ) = q.id as is_leaf,
            COUNT(*) OVER() AS total_count
        FROM quote q
            LEFT JOIN client c ON c.id = q.client_id
            LEFT JOIN obra o ON o.id = q.obra_id
        WHERE 1 = 1 
            ${id ? sql`AND q.id = ${id}` : sql``}
            ${parentId ? sql`AND q.parent_id = ${parentId}` : sql``}
            ${rootId ? sql`AND q.root_id = ${rootId}` : sql``}
            ${versionType ? sql`AND q.version_type = ${versionType}` : sql``}
            ${clientId ? sql`AND q.client_id = ${clientId}` : sql``}
            ${obraId ? sql`AND q.obra_id = ${obraId}` : sql``}
            ${quoteNumber ? sql`AND q.quote_number = ${quoteNumber}` : sql``}
            ${revisionNumber !== undefined ? sql`AND q.revision_number = ${revisionNumber}` : sql``}
            ${additionNumber !== undefined ? sql`AND q.addition_number = ${additionNumber}` : sql``}
            ${yearCode !== undefined ? sql`AND q.year_code = ${yearCode}` : sql``}
            ${
                createdByUserId
                    ? sql`AND q.created_by_user_id = ${createdByUserId}`
                    : sql``
            }

            ${(() => {
                if (rootStatus === 'onlyRoots') {
                    return sql`AND q.parent_id IS NULL`
                } else if (rootStatus === 'rootsAndAdditions') {
                    return sql`AND q.parent_id IS NULL`
                } else if (rootStatus === 'onlyLeaves') {
                    // Either it's the latest child quote or has no children
                    return sql`
                        AND (
                            (
                                SELECT q2.created_at FROM quote AS q2
                                WHERE q2.parent_id = q.id ${leafCandidateDeletedAtClause('q2')}
                                ORDER BY q2.created_at DESC LIMIT 1
                            ) = q.created_at
                            OR
                            (
                                SELECT COUNT(*) FROM quote AS q3
                                WHERE q3.parent_id = q.id ${leafCandidateDeletedAtClause('q3')}
                            ) = 0
                        )
                    `
                }

                return sql``
            })()}

            ${
                activationStatus !== 'all'
                    ? activationStatus === 'active'
                        ? sql`AND q.deleted_at IS NULL`
                        : sql`AND q.deleted_at IS NOT NULL`
                    : sql``
            }
            ${
                hasGeneralFuzzy || hasClientGeneralFuzzy || hasObraGeneralFuzzy
                    ? sql.unsafe(`AND ( 
                        ${[
                            stringGeneralFuzzyClause,
                            stringClientGeneralFuzzyClause,
                            stringObraGeneralFuzzyClause,
                        ]
                            .filter((c) => c)
                            .join(' OR ')}
                    )`)
                    : sql``
            }
        GROUP BY q.id, c.id, o.id
        ${
            order
                ? sql.unsafe(
                      getOrderByClause({
                          order,
                          map: {
                              updatedAt: 'q.updated_at',
                              createdAt: 'q.created_at',
                              quoteNumber: 'q.quote_number',
                              client_name: 'c.name',
                              obra_name: 'o.name',
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
        data: query.map((s) => formatFromDatabase(s, userId)),
        page,
        limit,
    }
}
