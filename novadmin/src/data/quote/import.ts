import { Sql } from 'postgres'
import { QuoteScope, QuoteElement } from '@novadmin/lib/types'
import { createPostgresClient } from '..'
import {
    upsert as upsertQuoteScope,
    list as listQuoteScopes,
} from 'data/quoteScope'
import { upsert as upsertQuoteElement } from 'data/quoteElement'
import { syncExternalDataToQuote } from './sync'
import { getLock } from './lock'
import { UpsertError } from 'error/index'

export type QuoteImportScopeRecord = Omit<
    QuoteScope,
    'quoteId' | 'lockedByUserId' | 'lockedAt'
> & {
    temporaryId: string
    existingScopeId?: number
}

export type QuoteImportElementRecord = Omit<
    QuoteElement,
    'quoteId' | 'scopeId'
> & {
    scopeTemporaryId?: string
}

export type QuoteImportParams = {
    quoteId: number
    scopes: QuoteImportScopeRecord[]
    elements: QuoteImportElementRecord[]
}

export type QuoteImportResult = {
    scopes: QuoteScope[]
    elements: QuoteElement[]
    sync: Awaited<ReturnType<typeof syncExternalDataToQuote>>
}

export const importScopesAndElements = async ({
    sql: outsideSql,
    quoteId,
    scopes,
    elements,
    userId,
}: {
    sql?: Sql
    userId?: number
} & QuoteImportParams): Promise<QuoteImportResult> => {
    try {
        const sql = outsideSql ?? createPostgresClient()
        const runner = sql.begin ? sql.begin : async (cb: any) => cb(sql)

        const result = await runner(async (sql: Sql) => {
            const scopeIdByTemporaryId = new Map<string, number>()
            const createdScopes: QuoteScope[] = []

            for (const scopeRecord of scopes) {
                const { temporaryId, existingScopeId, ...scopeFields } =
                    scopeRecord

                if (existingScopeId !== undefined) {
                    const existingScopeResult = await listQuoteScopes({
                        sql,
                        id: existingScopeId,
                        quoteId,
                        activationStatus: 'active',
                        page: 1,
                        limit: 1,
                    })
                    const existingScope = existingScopeResult.data[0]

                    if (!existingScope?.id) {
                        throw new UpsertError(
                            'Escopo não encontrado ou não pertence a este orçamento'
                        )
                    }

                    scopeIdByTemporaryId.set(temporaryId, existingScope.id)
                    continue
                }

                const record = {
                    ...scopeFields,
                    quoteId,
                    id: undefined,
                }

                const inserted = await upsertQuoteScope({
                    sql,
                    ignoreLock: true,
                    record,
                })

                const scope = Array.isArray(inserted) ? inserted[0] : inserted

                if (!scope?.id) {
                    throw new Error('Scope insert did not return id')
                }

                scopeIdByTemporaryId.set(temporaryId, scope.id)
                createdScopes.push(scope)
            }

            const quoteLock = await getLock({
                sql,
                id: quoteId,
                userId,
            })

            if (
                userId
                    ? quoteLock.isElementsLockedByAnotherUser
                    : quoteLock.isElementsLocked
            ) {
                throw new UpsertError(
                    'Quote elements are locked by another user'
                )
            }

            const createdElements: QuoteElement[] = []

            for (const elementRecord of elements) {
                const { scopeTemporaryId, ...rest } = elementRecord

                const scopeId = scopeTemporaryId
                    ? scopeIdByTemporaryId.get(scopeTemporaryId)
                    : null

                const record: QuoteElement = {
                    ...rest,
                    quoteId,
                    scopeId: scopeId as number | null,
                }

                const inserted = await upsertQuoteElement({
                    sql,
                    record,
                    userId,
                    ignoreLock: true,
                })

                const element = Array.isArray(inserted) ? inserted[0] : inserted

                createdElements.push(element)
            }

            const syncResult = await syncExternalDataToQuote({
                sql,
                quoteId,
                elements: {
                    products: {
                        operation: 'merge',
                    },
                },
                userId,
            })

            return {
                scopes: createdScopes,
                elements: createdElements,
                sync: syncResult,
            }
        })
        if (!outsideSql) {
            await sql.end()
        }

        return result
    } catch (error) {
        throw error
    }
}
