import { Sql, TransactionSql } from 'postgres'
import { convertIfPostgresError, createPostgresClient } from '..'
import { getLock, list, updateCosts } from '.'
import { UpsertError } from 'error/index'
import { list as listPricingOptions } from 'data/quotePricingOption'
import { list as listFixedCosts } from 'data/quoteFixedCost'
import { list as listProducts } from 'data/product'
import { list as listElements } from 'data/quoteElement'
import {
    list as listScopes,
    getLock as getScopeLock,
    upsert as upsertScope,
} from 'data/quoteScope'
import {
    Quote,
    QuoteElement,
    QuoteScope,
    QuoteScopeProductSnapshotMap,
} from '@novadmin/lib/types'
import {
    computedElements as computedElementsLib,
    elements as elementsLib,
} from '@novadmin/lib/quote'
import { omit } from 'lodash'

export type QuoteSyncOptions = {
    quoteId: number
    userId?: number
    elements: {
        pricingOptions?: {
            /*
            MERGE: Keep existing and add new ones
            REPLACE: Replace all with current configuration
            */
            operation: 'merge' | 'replace'
        }
        fixedCosts?: {
            /*
            MERGE: Keep existing and add new ones
            REPLACE: Replace all with current configuration
            */
            operation: 'merge' | 'replace'
        }
        products?: {
            /*
            MERGE: Add snapshot entries for referenced products missing from
                   quote.products; never touches existing entries
            REPLACE: Rebuild quote.products from scratch for every currently-
                     referenced product; entries for products no longer
                     referenced are dropped
            */
            operation: 'merge' | 'replace'
        }
        scopes?: ScopeSyncOptions
    }
}

export type ScopeSyncOptions = {
    fixedCosts?: {
        clearScopeOverrides: boolean
    }
    includedProductConsumptions?: {
        clearScopeOverrides: boolean
    }
}

export type QuoteDelta = Pick<
    Partial<Quote>,
    'pricingOptions' | 'fixedCosts' | 'products'
>

export type ScopeDelta = Pick<
    Partial<QuoteScope>,
    'overriddenFixedCosts' | 'overriddenProductConsumption'
>

export const syncExternalDataToQuote = async ({
    sql: outsideSql,
    quoteId,
    userId,
    elements: elementsToSync,
}: {
    sql?: Sql | TransactionSql
} & QuoteSyncOptions): Promise<{
    currentQuote: Quote
    delta: QuoteDelta
    updateRequired: boolean
    result: Quote
}> => {
    try {
        const sql = outsideSql ?? createPostgresClient()
        const runner = sql.begin ? sql.begin : async (cb: any) => cb(sql)

        return await runner(async (sql) => {
            const currentQuote = (
                await list({
                    sql,
                    id: quoteId,
                    activationStatus: 'all',
                    page: 1,
                    limit: 1,
                })
            ).data?.[0]

            if (!currentQuote) {
                throw new UpsertError('Quote not found')
            }

            let updateRequired = false
            const delta: QuoteDelta = {}

            if (elementsToSync?.pricingOptions?.operation) {
                try {
                    const pricingOptions = (
                        await listPricingOptions({
                            sql,
                            activationStatus: 'active',
                            page: 1,
                            limit: 1000,
                        })
                    )?.data

                    if (!pricingOptions.length) {
                        throw new UpsertError(
                            'No active pricing options found to sync'
                        )
                    }

                    if (elementsToSync.pricingOptions.operation === 'merge') {
                        const optionsNotInQuote = pricingOptions.filter(
                            (po) =>
                                !currentQuote.pricingOptions.some(
                                    (qpo) => qpo.id === po.id
                                )
                        )
                        if (optionsNotInQuote.length) {
                            updateRequired = true
                            delta.pricingOptions = [
                                ...currentQuote.pricingOptions,
                                ...optionsNotInQuote,
                            ]
                        }
                    } else if (
                        elementsToSync.pricingOptions.operation === 'replace'
                    ) {
                        updateRequired = true
                        const quoteSpecificOnly =
                            currentQuote.pricingOptions.filter(
                                (qpo) =>
                                    !pricingOptions.some(
                                        (po) => po.id === qpo.id
                                    )
                            )
                        delta.pricingOptions = [
                            ...pricingOptions,
                            ...quoteSpecificOnly,
                        ]
                    } else {
                        throw new UpsertError(
                            'Invalid operation for pricing options sync'
                        )
                    }
                } catch (error) {
                    if (error instanceof UpsertError) {
                        throw error
                    }
                    throw new UpsertError(
                        'Error getting pricing options: ' +
                            (error as Error).message
                    )
                }
            }

            if (elementsToSync?.fixedCosts?.operation) {
                try {
                    const fixedCosts = (
                        await listFixedCosts({
                            sql,
                            activationStatus: 'active',
                            page: 1,
                            limit: 1000,
                        })
                    )?.data

                    if (!fixedCosts.length) {
                        throw new UpsertError(
                            'No active fixed costs found to sync'
                        )
                    }

                    if (elementsToSync.fixedCosts.operation === 'merge') {
                        const costsNotInQuote = fixedCosts.filter(
                            (fc) =>
                                !currentQuote.fixedCosts.some(
                                    (qfc) => qfc.id === fc.id
                                )
                        )
                        if (costsNotInQuote.length) {
                            updateRequired = true
                            delta.fixedCosts = [
                                ...currentQuote.fixedCosts,
                                ...costsNotInQuote,
                            ]
                        }
                    } else if (
                        elementsToSync.fixedCosts.operation === 'replace'
                    ) {
                        updateRequired = true
                        const quoteSpecificOnly =
                            currentQuote.fixedCosts.filter(
                                (qfc) =>
                                    !fixedCosts.some((fc) => fc.id === qfc.id)
                            )
                        delta.fixedCosts = [...fixedCosts, ...quoteSpecificOnly]
                    } else {
                        throw new UpsertError(
                            'Invalid operation for fixed costs sync'
                        )
                    }
                } catch (error) {
                    if (error instanceof UpsertError) {
                        throw error
                    }
                    throw new UpsertError(
                        'Error getting fixed costs: ' + (error as Error).message
                    )
                }
            }

            if (elementsToSync?.products?.operation) {
                try {
                    const globalProducts = (
                        await listProducts({
                            sql,
                            includeDeleted: false,
                            page: 1,
                            limit: 1000,
                        })
                    )?.data

                    const scopesForProducts = await listScopes({
                        sql,
                        quoteId: quoteId,
                        activationStatus: 'all',
                        page: 1,
                        limit: 1000,
                    })

                    const rawElements = await listElements({
                        sql,
                        quoteId: quoteId,
                        activationStatus: 'active',
                        page: 1,
                        limit: 1000,
                    })

                    const derivedElements = (
                        rawElements.data as QuoteElement[]
                    ).map(elementsLib.appendElementDerivedValues)
                    const computedElements =
                        computedElementsLib.generateComputedElements(
                            derivedElements,
                            scopesForProducts.data as QuoteScope[]
                        )
                    const allElements = [
                        ...derivedElements,
                        ...computedElements,
                    ]
                    const referencedProductIds = new Set(
                        allElements
                            .map((e) => e.productId)
                            .filter((id): id is number => id != null)
                    )

                    if (elementsToSync.products.operation === 'merge') {
                        const existingIds = new Set(
                            Object.keys(currentQuote.products ?? {}).map(Number)
                        )
                        const missingIds = [...referencedProductIds].filter(
                            (id) => !existingIds.has(id)
                        )
                        if (missingIds.length) {
                            const newEntries: QuoteScopeProductSnapshotMap = {}
                            for (const id of missingIds) {
                                const product = globalProducts.find(
                                    (p) => p.id === id
                                )
                                if (product) {
                                    newEntries[String(id)] = { ...product, id }
                                }
                            }
                            if (Object.keys(newEntries).length) {
                                updateRequired = true
                                delta.products = {
                                    ...currentQuote.products,
                                    ...newEntries,
                                }
                            }
                        }
                    } else if (
                        elementsToSync.products.operation === 'replace'
                    ) {
                        const newProducts: QuoteScopeProductSnapshotMap = {}
                        for (const id of referencedProductIds) {
                            const product = globalProducts.find(
                                (p) => p.id === id
                            )
                            if (product) {
                                newProducts[String(id)] = { ...product, id }
                            }
                        }
                        updateRequired = true
                        delta.products = newProducts
                    } else {
                        throw new UpsertError(
                            'Invalid operation for products sync'
                        )
                    }
                } catch (error) {
                    if (error instanceof UpsertError) {
                        throw error
                    }
                    throw new UpsertError(
                        'Error getting products: ' + (error as Error).message
                    )
                }
            }

            if (!updateRequired) {
                return {
                    currentQuote,
                    delta,
                    updateRequired,
                    result: currentQuote,
                }
            }

            try {
                const lock = await getLock({
                    sql,
                    id: quoteId,
                    userId,
                })

                if (
                    userId
                        ? lock.isCostsLockedByAnotherUser
                        : lock.isCostsLocked
                ) {
                    throw new UpsertError(
                        'Quote costs are locked by another user'
                    )
                }

                await updateCosts({
                    sql,
                    record: {
                        ...omit(
                            currentQuote,
                            'createdAt',
                            'updatedAt',
                            'deletedAt'
                        ),
                        id: quoteId,
                        fixedCosts: delta.fixedCosts ?? currentQuote.fixedCosts,
                        pricingOptions:
                            delta.pricingOptions ?? currentQuote.pricingOptions,
                        productConsumption: currentQuote.productConsumption,
                        products: delta.products ?? currentQuote.products,
                    },
                    ignoreLock: true,
                })
            } catch (error) {
                if (error instanceof UpsertError) {
                    throw error
                }
                throw new UpsertError(
                    'Error updating quote costs: ' + (error as Error).message
                )
            }

            try {
                const scopes = await listScopes({
                    sql,
                    quoteId: quoteId,
                    activationStatus: 'all',
                    page: 1,
                    limit: 1000,
                })

                for (const scope of scopes.data) {
                    await syncExternalDataToScope({
                        sql,
                        scope,
                        elements: elementsToSync.scopes || {},
                        userId,
                    })
                }
            } catch (error) {
                if (error instanceof UpsertError) {
                    throw error
                }
                throw new UpsertError(
                    'Error updating quote scopes: ' + (error as Error).message
                )
            }

            const updatedQuote = (
                await list({
                    sql,
                    id: quoteId,
                    activationStatus: 'all',
                    page: 1,
                    limit: 1,
                })
            )?.data?.[0]

            const updatedScopes = (
                await listScopes({
                    sql,
                    quoteId: quoteId,
                    activationStatus: 'all',
                    page: 1,
                    limit: 1000,
                })
            )?.data

            return {
                currentQuote,
                delta,
                updateRequired: updateRequired,
                result: updatedQuote,
                scopeResult: updatedScopes,
            }
        })
    } catch (error) {
        if (error instanceof UpsertError) {
            throw error
        }
        convertIfPostgresError(error)
        console.error('Error creating quote:', error)
        throw error
    }
}

export const syncExternalDataToScope = async ({
    sql,
    scope,
    elements: elementsToSync,
    userId,
}: {
    sql?: Sql | TransactionSql
} & {
    scope: QuoteScope
    elements: ScopeSyncOptions
    userId?: number
}): Promise<{
    currentScope: QuoteScope
    delta: Partial<QuoteScope>
    updateRequired: boolean
    result: QuoteScope
}> => {
    let updateRequired = false
    const delta: ScopeDelta = {}

    if (elementsToSync.fixedCosts?.clearScopeOverrides) {
        try {
            if (scope.overriddenFixedCosts.length) {
                updateRequired = true
                delta.overriddenFixedCosts = []
            }
        } catch (error) {
            throw new UpsertError(
                'Error processing fixed costs sync: ' + (error as Error).message
            )
        }
    }

    if (elementsToSync.includedProductConsumptions?.clearScopeOverrides) {
        try {
            if (scope.overriddenProductConsumption.length) {
                updateRequired = true
                delta.overriddenProductConsumption = []
            }
        } catch (error) {
            throw new UpsertError(
                'Error processing product consumption sync: ' +
                    (error as Error).message
            )
        }
    }

    if (!updateRequired) {
        return {
            currentScope: scope,
            delta,
            updateRequired,
            result: scope,
        }
    }

    const lock = await getScopeLock({
        sql,
        id: scope.id!,
        userId,
    })

    if (userId ? lock.isLockedByAnotherUser : lock.isLocked) {
        throw new UpsertError(`Scope ${scope.name} is locked by another user`)
    }

    const result = await upsertScope({
        sql,
        record: {
            ...omit(scope, 'createdAt', 'updatedAt', 'deletedAt'),
            overriddenFixedCosts:
                delta.overriddenFixedCosts ?? scope.overriddenFixedCosts,
            overriddenProductConsumption:
                delta.overriddenProductConsumption ??
                scope.overriddenProductConsumption,
        },
        ignoreLock: true,
    })

    return {
        currentScope: scope,
        delta,
        updateRequired,
        result: result?.[0],
    }
}
