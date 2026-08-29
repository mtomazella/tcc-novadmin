import {
    SnakeCaseKeys,
    IncludeDatabaseDates,
    QuotePricingOption,
} from '@novadmin/lib/types'

export type DatabaseQuotePricingOption = SnakeCaseKeys<
    IncludeDatabaseDates<QuotePricingOption>
>

export type UpsertQuotePricingOptionRecord = QuotePricingOption

export type QuotePricingOptionFuzzyFields = 'name' | 'description'

export const formatFromDatabase = (
    quotePricingOption: DatabaseQuotePricingOption
): IncludeDatabaseDates<QuotePricingOption> => {
    const newRecord: any = {
        ...quotePricingOption,
        id: String(quotePricingOption.id),
        valueReto: quotePricingOption.value_reto,
        valueCambotado: quotePricingOption.value_cambotado,
        valueGarfo: quotePricingOption.value_garfo,
        createdAt: quotePricingOption.created_at,
        updatedAt: quotePricingOption.updated_at,
        deletedAt: quotePricingOption.deleted_at,
    }

    delete (newRecord as any).total_count
    delete (newRecord as any).value_reto
    delete (newRecord as any).value_cambotado
    delete (newRecord as any).value_garfo
    delete (newRecord as any).created_at
    delete (newRecord as any).updated_at
    delete (newRecord as any).deleted_at
    return newRecord
}

export * from './list'
export * from './upsert'
export * from './remove'
