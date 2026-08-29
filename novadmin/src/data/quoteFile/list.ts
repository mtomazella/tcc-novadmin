import { IncludeDatabaseDates, QuoteFile } from '@novadmin/lib/types'
import { createPostgresClient, getOrderByClause, validateListParams } from '..'
import { DatabaseQuoteFile, formatFromDatabase } from '.'
import { ActivationStatusFilter } from '@novadmin/lib/types'
import { Sql } from 'postgres'

export type OrderOptions = 'updatedAt' | 'createdAt' | 'name'

export const defaultOrderOption: OrderOptions = 'name'

export const list = async (params: {
    sql?: Sql
    id?: number
    quoteId?: number
    activationStatus: ActivationStatusFilter
    includeContent: boolean
    order?: string
    page: number
    limit: number
}): Promise<{
    data: IncludeDatabaseDates<QuoteFile>[]
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
        quoteId,
        page,
        limit,
        activationStatus,
        includeContent,
        order = defaultOrderOption,
    } = params

    const sql = outsideSql ?? createPostgresClient()

    const query = await sql<
        (Omit<DatabaseQuoteFile, 'file_content'> & { total_count: number })[]
    >`
        SELECT 
            f.id,
            f.quote_id,
            f.name,
            f.uploaded_by,
            f.created_at,
            f.updated_at,
            f.deleted_at,
            ${includeContent ? sql`f.file_content,` : sql``}
            COUNT(*) OVER() AS total_count
        FROM quote_file f
        WHERE 1 = 1 
            ${id ? sql`AND f.id = ${id}` : sql``}
            ${quoteId ? sql`AND f.quote_id = ${quoteId}` : sql``}
            ${
                activationStatus !== 'all'
                    ? activationStatus === 'active'
                        ? sql`AND f.deleted_at IS NULL`
                        : sql`AND f.deleted_at IS NOT NULL`
                    : sql``
            }
        ${
            order
                ? sql.unsafe(
                      getOrderByClause({
                          order,
                          map: {
                              updatedAt: 'f.updated_at',
                              createdAt: 'f.created_at',
                              name: 'f.name',
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
        data: query.map(formatFromDatabase),
        page,
        limit,
    }
}
