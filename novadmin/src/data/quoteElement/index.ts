import {
    SnakeCaseKeys,
    IncludeDatabaseDates,
    QuoteElement,
} from '@novadmin/lib/types'
import {
    DatabaseProduct,
    formatFromDatabase as formatProductFromDatabase,
} from 'data/product'
import {
    DatabaseQuoteScope,
    formatFromDatabase as formatScopeFromDatabase,
} from 'data/quoteScope'

export type DatabaseQuoteElement = SnakeCaseKeys<
    IncludeDatabaseDates<QuoteElement>
>

export type UpsertQuoteElementRecord = QuoteElement

export type QuoteElementFuzzyFields = 'name'

export const formatFromDatabase = (
    quoteElement: DatabaseQuoteElement
): IncludeDatabaseDates<QuoteElement> => {
    const newRecord: IncludeDatabaseDates<QuoteElement> = {
        ...quoteElement,
        quoteId: quoteElement.quote_id,
        scopeId: quoteElement.scope_id,
        productId: quoteElement.product_id,
        createdAt: quoteElement.created_at,
        updatedAt: quoteElement.updated_at,
        deletedAt: quoteElement.deleted_at,
    }

    if (quoteElement.product_name) {
        newRecord.productName = quoteElement.product_name
    }

    if (quoteElement.product) {
        newRecord.product = formatProductFromDatabase(
            quoteElement.product as unknown as DatabaseProduct
        )
    }

    if (quoteElement.scope) {
        newRecord.scope = formatScopeFromDatabase(
            quoteElement.scope as unknown as DatabaseQuoteScope
        )
    }

    delete (newRecord as any).total_count
    delete (newRecord as any).quote_id
    delete (newRecord as any).scope_id
    delete (newRecord as any).product_id
    delete (newRecord as any).product_name
    delete (newRecord as any).category_counts
    delete (newRecord as any).created_at
    delete (newRecord as any).updated_at
    delete (newRecord as any).deleted_at
    return newRecord
}

export * from './list'
export * from './upsert'
export * from './remove'
