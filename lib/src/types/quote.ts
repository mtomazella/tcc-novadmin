import type {
    Client,
    IncludeDatabaseDates,
    LockInformation,
    Material,
    MaterialType,
    Obra,
    Product,
} from './entity.js'

export type QuoteFixedCostValueType = 'price' | 'percentage'
export const QuoteFixedCostValueTypes: QuoteFixedCostValueType[] = [
    'price',
    'percentage',
]

export type QuoteFixedCost = {
    id: string
    name: string
    description?: string
    valueType: QuoteFixedCostValueType
    value: number
}

export type QuotePricingOption = {
    id?: string
    name: string
    description?: string
    valueReto: number
    valueCambotado: number
    valueGarfo: number
}

export type QuoteElementType = 'pilar' | 'viga' | 'laje' | 'outro'
export const QuoteElementTypes: QuoteElementType[] = [
    'pilar',
    'viga',
    'laje',
    'outro',
]

export type QuoteScopeMaterialSelectionElementType = QuoteElementType | 'outro'
export const QuoteScopeMaterialSelectionElementTypes: QuoteScopeMaterialSelectionElementType[] =
    ['pilar', 'viga', 'laje', 'outro']

export type QuoteScopeMaterialSelectionOverrides = {
    value?: number
}

export type QuoteScopeMaterialSnapshot = Omit<Material, 'id'> & {
    id: number
}

export type QuoteScopeMaterialSnapshotMap = Record<
    string,
    QuoteScopeMaterialSnapshot
>

export type QuoteScopeProductSnapshot = Omit<Product, 'id'> & {
    id: number
}

export type QuoteScopeProductSnapshotMap = Record<
    string,
    QuoteScopeProductSnapshot
>

export type QuoteScopeMaterialSelection = {
    elementType: QuoteScopeMaterialSelectionElementType
    category: string
    materialType: MaterialType
    materialId: number
    overrides: QuoteScopeMaterialSelectionOverrides
}

export type QuoteElementModifier =
    | 'cambotado'
    | 'ripado'
    | 'aparente'
    | 'paginado'
    | 'needsGarfo'
    | 'needsGastalho'
    | 'garfo'
    | 'gastalho'
    | 'fundoDeViga'

export type QuoteElementPilarValues = {
    fundoCm: number
    lateralCm: number
    peDireitoM: number
    quantidade: number
    cambotado: boolean
    needsGastalho: boolean
    ripado: boolean
    aparente: boolean
    paginado: boolean
    metragemM2?: number
}
export type QuoteElementVigaValues = {
    fundoCm: number
    lateralCm: number
    comprimentoCm: number
    alturaLajeLateralACm: number
    alturaLajeLateralBCm: number
    quantidade: number
    tipo: 'interno' | 'borda'
    cambotado: boolean
    needsGarfo: boolean
    ripado: boolean
    aparente: boolean
    paginado: boolean
    fundoDeVigaM2?: number
    lateralDeVigaM2?: number
}
export type QuoteElementLajeValues = {
    areaM2: number
    perimetroM: number
    fechamentoM2: number
    quantidade: number
    ripado: boolean
    aparente: boolean
    paginado: boolean
    faixasAdicionaisM2?: number
    metragemM2?: number
}

export type QuoteElementOutroValues = {
    quantidade: number
    metragemM2: number
}

export type QuoteElementValues =
    | QuoteElementPilarValues
    | QuoteElementVigaValues
    | QuoteElementLajeValues
    | QuoteElementOutroValues

export type QuoteElement = {
    id?: number
    quoteId: number
    scopeId: number | null
    productId: number
    type: QuoteElementType
    name: string
    values: QuoteElementValues
    productName?: string
    product?: IncludeDatabaseDates<Product> | null
    category?: string
    scope?: QuoteScope | null
}

export type QuoteGroupedElement = {
    category: string
    categoryName?: string
    elements: QuoteElement[]
    quantity: number
    totalM2?: number
    commercialTotalM2?: number
    projectTotalM2?: number
}

export type QuoteScope = {
    id?: number
    quoteId: number
    name: string

    supplyType?: string
    scopeType?: string
    boundary?: string
    ceilingHeight?: string
    projectFileName?: string
    gastalhoCount?: number
    garfoBordaEnabled?: boolean
    garfoInternoEnabled?: boolean
    fundoAdicionalCount?: number
    tiraAdicionalCount?: number
    observations?: string

    overriddenFixedCosts: QuoteFixedCost[]
    overriddenProductConsumption: QuoteProductConsumption[]
    materials: QuoteScopeMaterialSnapshotMap
    materialSelections: QuoteScopeMaterialSelection[]

    lockedByUserId?: number | null
    lockedAt?: Date | null
} & Partial<LockInformation>

export type QuoteProductConsumption = {
    id: number
    category: string
    commercialPercentage: number | null
    projectPercentage: number | null
    consumptionRates: {
        icChapa1: number | null
        icRipa1: number | null
        icChapa2: number | null
        icRipa2: number | null
        icChapa3: number | null
        icRipa3: number | null
    }
}

export type QuoteFile = {
    id?: number
    quoteId: number
    name: string
    fileContent?: string | null
    uploadedBy?: number | null
}

export type DelimitacaoLegendItem = {
    color: string // hex color string, e.g. "#E05C1C"
    text: string
}

export type DelimitacaoSection = {
    id: string // uuid — stable client-side key for React list rendering
    title: string // user-editable; default "DELIMITAÇÃO"
    observacoesText: string
    legendItems: DelimitacaoLegendItem[]
    selectedFileIds: number[] // ordered list of quote_file ids to display
    fileScales?: Record<string, number> // fileId (string) → scale percentage 1–100; default 100
}

export type AreaOrderGroup = {
    id: string
    name: string
    scopeIds: number[]
}

export type QuoteVersionType = 'revision' | 'addition'

export type Quote = {
    id?: number
    parentId: number | null
    rootId: number | null
    versionType: QuoteVersionType | null

    quoteNumber: string
    revisionNumber: number
    additionNumber: number
    yearCode: number

    clientId: number
    obraId: number
    createdByUserId: number

    selectedPricingOptionId: string | null
    pricingOptions: QuotePricingOption[]
    fixedCosts: QuoteFixedCost[]
    productConsumption: QuoteProductConsumption[]

    documentOptions: Record<string, any>
    products?: QuoteScopeProductSnapshotMap

    elementsLockedByUserId?: number | null
    elementsLockedAt?: Date | null
    costsLockedByUserId?: number | null
    costsLockedAt?: Date | null
    documentLockedByUserId?: number | null
    documentLockedAt?: Date | null

    formattedQuoteNumber?: string
    versionSummary?: {
        id: number
        parentId: number | null
        versionType: QuoteVersionType | null
        quoteNumber: string
        revisionNumber: number
        additionNumber: number
        yearCode: number
        createdAt: Date
        createdByUserId: number
        formattedQuoteNumber?: string
    }[]
    isRoot?: boolean
    isLeaf?: boolean
    client?: IncludeDatabaseDates<Client>
    obra?: IncludeDatabaseDates<Obra>

    createdAt?: Date
    updatedAt?: Date
    deletedAt?: Date | null
}
