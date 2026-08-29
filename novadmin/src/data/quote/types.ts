import {
    SnakeCaseKeys,
    IncludeDatabaseDates,
    Quote,
    QuotePricingOption,
    QuoteFixedCost,
    QuoteProductConsumption,
    QuoteScopeProductSnapshotMap,
    QuoteVersionType,
} from '@novadmin/lib/types'

export type DatabaseQuote = SnakeCaseKeys<IncludeDatabaseDates<Quote>>

export type VersionSummaryElement = {
    id: number
    parentId: number | null
    versionType: QuoteVersionType | null
    quoteNumber: string
    revisionNumber: number
    additionNumber: number
    yearCode: number
    createdAt: Date
    createdByUserId: number
}

export type CreateQuoteRecord = {
    clientId: number
    obraId: number
    userId: number
    quoteNumber?: string
    revisionNumber?: number
    additionNumber?: number
    yearCode?: number
}

export type CreateQuoteVersionRecord = {
    parentId: number
    versionType: QuoteVersionType
    userId: number
}

export type UpdateQuoteRecord = {
    id: number
    parentId: number | null
    rootId: number | null
    versionType: QuoteVersionType | null
    quoteNumber: string
    revisionNumber: number
    additionNumber: number
    yearCode: number
    clientId: number
    obraId: number
    selectedPricingOptionId?: string | null
    pricingOptions: QuotePricingOption[]
    fixedCosts: QuoteFixedCost[]
    productConsumption: QuoteProductConsumption[]
    documentOptions: Record<string, any>
    products?: QuoteScopeProductSnapshotMap
}
export type UpdateGeneralQuoteRecord = {
    id: number
    products?: QuoteScopeProductSnapshotMap
}
export type UpdateQuoteCostsRecord = Pick<
    UpdateQuoteRecord,
    | 'id'
    | 'pricingOptions'
    | 'fixedCosts'
    | 'productConsumption'
    | 'selectedPricingOptionId'
    | 'products'
>
export type UpdateQuoteDocumentRecord = Pick<
    UpdateQuoteRecord,
    'id' | 'documentOptions'
>

export type QuoteFuzzyField = 'quoteNumber' | 'client_name' | 'obra_name'
export const QuoteFuzzyFields: QuoteFuzzyField[] = [
    'quoteNumber',
    'client_name',
    'obra_name',
]
