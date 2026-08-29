import { Sql } from 'postgres'
import {
    CreateQuoteRecord,
    CreateQuoteVersionRecord,
    DatabaseQuote,
    formatFromDatabase,
    list,
} from '.'
import { convertIfPostgresError, createPostgresClient } from '..'
import { padNumberLeft } from 'utils/string'
import { QuoteVersionType } from '@novadmin/lib/types'
import { UpsertError } from 'error/index'

export const create = async ({
    sql: outsideSql,
    userId,
    clientId,
    obraId,
    quoteNumber,
    revisionNumber,
    additionNumber,
    yearCode,
}: {
    sql?: Sql
} & CreateQuoteRecord) => {
    try {
        const sql = outsideSql ?? createPostgresClient()

        const result = await sql.begin(async (sql) => {
            const resolvedYearCode =
                yearCode ??
                Number(new Date().getFullYear().toString().slice(-2))

            const resolvedQuoteNumber =
                quoteNumber ??
                padNumberLeft(
                    (
                        await list({
                            sql,
                            yearCode: resolvedYearCode,
                            activationStatus: 'all',
                            page: 1,
                            limit: 1,
                        })
                    )?.count?.total + 1,
                    3
                )

            const resolvedRevisionNumber = revisionNumber ?? 0
            const resolvedAdditionNumber = additionNumber ?? 0

            const existing = await list({
                sql,
                quoteNumber: resolvedQuoteNumber,
                revisionNumber: resolvedRevisionNumber,
                additionNumber: resolvedAdditionNumber,
                yearCode: resolvedYearCode,
                activationStatus: 'active',
                page: 1,
                limit: 1,
            })

            if (existing.count.total > 0) {
                throw new UpsertError(
                    'Já existe um orçamento com este número, revisão, adição e ano.'
                )
            }

            const query = await sql<DatabaseQuote[]>`
                INSERT INTO quote (
                    quote_number,
                    revision_number,
                    addition_number,
                    year_code,
                    client_id,
                    obra_id,
                    created_by_user_id
                )
                VALUES (
                    ${resolvedQuoteNumber},
                    ${resolvedRevisionNumber},
                    ${resolvedAdditionNumber},
                    ${resolvedYearCode},
                    ${clientId},
                    ${obraId},
                    ${userId}
                )
                RETURNING *;
            `

            const initialQuote = query.map(formatFromDatabase)[0]

            return {
                quote:
                    (await refetchQuote(sql, initialQuote.id as number)) ??
                    initialQuote,
            }
        })
        if (!outsideSql) {
            await sql.end()
        }

        return result
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error creating quote:', error)
        throw error
    }
}

const createNewVersionGeneric = async ({
    sql: outsideSql,
    userId,
    parentId,
    rootId,
    versionType,
    quoteNumber,
    revisionNumber = 0,
    additionNumber = 0,
    yearCode,
    copyProducts,
}: {
    sql?: Sql
    userId?: number
    parentId: number
    rootId: number
    versionType: QuoteVersionType
    quoteNumber: string
    revisionNumber?: number
    additionNumber?: number
    yearCode: number
    copyProducts: boolean
}) => {
    try {
        const sql = outsideSql ?? createPostgresClient()

        const query = await sql<DatabaseQuote[]>`
            INSERT INTO quote (
                parent_id,
                root_id,
                version_type,
                quote_number,
                revision_number,
                addition_number,
                year_code,
                client_id,
                obra_id,
                created_by_user_id,
                selected_pricing_option_id,
                pricing_options,
                fixed_costs,
                product_consumption,
                document_options,
                products
            )
            SELECT
                ${parentId},
                ${rootId},
                ${versionType},
                ${quoteNumber},
                ${revisionNumber},
                ${additionNumber},
                ${yearCode},
                client_id,
                obra_id,
                ${userId ?? sql`DEFAULT`},
                selected_pricing_option_id,
                pricing_options,
                fixed_costs,
                product_consumption,
                document_options,
                ${copyProducts ? sql`products` : sql`'{}'::jsonb`}
            FROM quote
            WHERE id = ${parentId}
            RETURNING *;
        `
        if (!outsideSql) {
            await sql.end()
        }

        return query.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error creating new version of quote:', error)
        throw error
    }
}

// A plain INSERT...RETURNING never populates the computed fields (isLeaf,
// isRoot, formattedQuoteNumber, ...) that only list()'s correlated
// subqueries produce — re-fetch so callers get a fully-computed quote.
const refetchQuote = async (sql: Sql, id: number) =>
    (
        await list({
            sql,
            id,
            activationStatus: 'active',
            page: 1,
            limit: 1,
        })
    )?.data?.[0]

export const createRevision = async ({
    sql: outsideSql,
    userId,
    parentId,
}: {
    sql?: Sql
} & CreateQuoteVersionRecord) => {
    const sql = outsideSql ?? createPostgresClient()

    const result = await sql.begin(async (sql) => {
        const parentQuote = (
            await list({
                sql,
                id: parentId,
                activationStatus: 'active',
                page: 1,
                limit: 1,
                userId,
            })
        )?.data?.[0]

        if (!parentQuote) {
            throw new UpsertError('Parent quote not found')
        }

        if (!parentQuote.isLeaf) {
            throw new UpsertError(
                'Cannot create a quote from a parent that is not a leaf node'
            )
        }

        const [newQuote] = await createNewVersionGeneric({
            sql,
            userId,
            parentId,
            rootId: parentQuote.rootId as number,
            versionType: 'revision',
            quoteNumber: parentQuote.quoteNumber,
            revisionNumber: parentQuote.revisionNumber + 1,
            additionNumber: parentQuote.additionNumber,
            yearCode: parentQuote.yearCode,
            copyProducts: true,
        })

        const newQuoteId = newQuote.id as number

        const parentScopes = await sql<{ id: number }[]>`
            SELECT id FROM quote_scope
            WHERE quote_id = ${parentId} AND deleted_at IS NULL
        `

        for (const { id: oldScopeId } of parentScopes) {
            const [{ id: newScopeId }] = await sql<{ id: number }[]>`
                INSERT INTO quote_scope (
                    quote_id, name, supply_type, scope_type, boundary,
                    ceiling_height, project_file_name, gastalho_count,
                    garfo_borda_enabled, garfo_interno_enabled,
                    fundo_adicional_count, tira_adicional_count, observations,
                    overridden_fixed_costs, overridden_product_consumption,
                    materials, material_selections
                )
                SELECT
                    ${newQuoteId}, name, supply_type, scope_type, boundary,
                    ceiling_height, project_file_name, gastalho_count,
                    garfo_borda_enabled, garfo_interno_enabled,
                    fundo_adicional_count, tira_adicional_count, observations,
                    overridden_fixed_costs, overridden_product_consumption,
                    materials, material_selections
                FROM quote_scope
                WHERE id = ${oldScopeId}
                RETURNING id;
            `

            await sql`
                INSERT INTO quote_element (
                    quote_id, scope_id, product_id, type, name, values
                )
                SELECT ${newQuoteId}, ${newScopeId}, product_id, type, name, values
                FROM quote_element
                WHERE scope_id = ${oldScopeId}
                    AND quote_id = ${parentId}
                    AND deleted_at IS NULL;
            `
        }

        // Elements with no scope, or whose scope was soft-deleted (deleting a
        // scope does not cascade to its elements) — carry them forward as
        // unassigned rather than silently dropping them.
        await sql`
            INSERT INTO quote_element (
                quote_id, scope_id, product_id, type, name, values
            )
            SELECT ${newQuoteId}, NULL, product_id, type, name, values
            FROM quote_element
            WHERE quote_id = ${parentId}
                AND deleted_at IS NULL
                AND (
                    scope_id IS NULL
                    OR scope_id NOT IN (
                        SELECT id FROM quote_scope
                        WHERE quote_id = ${parentId} AND deleted_at IS NULL
                    )
                );
        `

        return [(await refetchQuote(sql, newQuoteId)) ?? newQuote]
    })
    if (!outsideSql) {
        await sql.end()
    }

    return result
}

export const createAddition = async ({
    sql: outsideSql,
    userId,
    parentId,
}: {
    sql?: Sql
} & CreateQuoteVersionRecord) => {
    const sql = outsideSql ?? createPostgresClient()

    const result = await sql.begin(async (sql) => {
        const parentQuote = (
            await list({
                sql,
                id: parentId,
                activationStatus: 'active',
                page: 1,
                limit: 1,
                userId,
            })
        )?.data?.[0]

        if (!parentQuote) {
            throw new UpsertError('Parent quote not found')
        }

        if (!parentQuote.isLeaf) {
            throw new UpsertError(
                'Cannot create a quote from a parent that is not a leaf node'
            )
        }

        const [newQuote] = await createNewVersionGeneric({
            sql,
            userId,
            parentId,
            rootId: parentQuote.rootId as number,
            versionType: 'addition',
            quoteNumber: parentQuote.quoteNumber,
            revisionNumber: parentQuote.revisionNumber,
            additionNumber: parentQuote.additionNumber + 1,
            yearCode: parentQuote.yearCode,
            copyProducts: false,
        })

        return [(await refetchQuote(sql, newQuote.id as number)) ?? newQuote]
    })
    if (!outsideSql) {
        await sql.end()
    }

    return result
}
