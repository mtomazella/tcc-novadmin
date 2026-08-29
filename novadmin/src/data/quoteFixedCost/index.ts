import {
    SnakeCaseKeys,
    IncludeDatabaseDates,
    QuoteFixedCost,
} from '@novadmin/lib/types'

export type DatabaseQuoteFixedCost = SnakeCaseKeys<
    IncludeDatabaseDates<QuoteFixedCost>
>

export type UpsertQuoteFixedCostRecord = QuoteFixedCost

export type QuoteFixedCostFuzzyFields = 'name' | 'description'

export const formatFromDatabase = (
    quoteFixedCost: DatabaseQuoteFixedCost
): IncludeDatabaseDates<QuoteFixedCost> => {
    const newRecord: any = {
        ...quoteFixedCost,
        valueType: quoteFixedCost.value_type,
        value: Number(quoteFixedCost.value),
        createdAt: quoteFixedCost.created_at,
        updatedAt: quoteFixedCost.updated_at,
        deletedAt: quoteFixedCost.deleted_at,
    }

    delete (newRecord as any).total_count
    delete (newRecord as any).value_type
    delete (newRecord as any).created_at
    delete (newRecord as any).updated_at
    delete (newRecord as any).deleted_at
    return newRecord
}

export * from './list'
export * from './upsert'
