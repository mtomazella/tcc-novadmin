import type { QuoteElementType } from './quote.js'

export type OptionalId<T> = T & {
    id?: string
}

export type DatabaseKeys<T> = {
    [K in keyof T as K extends string ? Lowercase<K> : K]: T[K]
}

type CamelToSnake<S extends string> = S extends `${infer Head}${infer Tail}`
    ? Tail extends Uncapitalize<Tail>
        ? `${Lowercase<Head>}${CamelToSnake<Tail>}`
        : `${Lowercase<Head>}_${CamelToSnake<Uncapitalize<Tail>>}`
    : S

export type SnakeCaseKeys<T> = {
    [K in keyof T as CamelToSnake<string & K>]: T[K]
}

export type IncludeDatabaseDates<T> = {
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
} & T

export type IncludeClient<T> = T & {
    client: {}
}
export type IncludeClientOptional<T> = T & {
    client?: {}
}

export type Client = {
    id: string
    name: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
    phone?: string
}

export type IncludePassword<T> = T & { password: string }
export type IncludeOptionalPassword<T> = T & { password?: string }
export type User = {
    id: number
    name: string
    role?: string
    email: string
    permissions?: string[]
}

export type Product = {
    id?: number
    name: string
    description?: string
    shorthand?: string
    typeOnQuote?: QuoteElementType
    modifiers: {
        cambotado: boolean
        ripado: boolean
        aparente: boolean
        paginado: boolean
        needsGarfo: boolean
        needsGastalho: boolean
        garfo: boolean
        gastalho: boolean
        fundoDeViga: boolean
    }
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

export type Obra = {
    id: string
    name: string
    description?: string
    phone?: string
    email?: string
    address?: string
    addressComplement?: string
    contact?: string
    clientId?: number
    clientDeleted?: boolean
    client?: IncludeDatabaseDates<Client> | null
}

export type Tag = {
    id: number
    name: string
    description?: string
}

export type RomaneioTag = {
    tagId: number
    romaneioId: number
    value: string
    tagName?: string
}

export type ItemPackageStatus = 'unassigned' | 'assigned' | 'deleted'

export type ItemWorkflowStatus =
    | 'listed'
    | 'in_production'
    | 'processed'
    | 'packaged'
    | 'in_transit'
    | 'delivered'

export type Item = {
    id?: number
    itemGroupCode: string
    itemGroupIndex: string
    displayItemCode?: string
    projectSheet: string
    productId: number | null
    romaneioId: number | null
    packageId: number | null
    lastUpdateUserId: number | null
    workflowStatus?: ItemWorkflowStatus
    product?: IncludeDatabaseDates<Product> | null
    productDeleted?: boolean
    package?: IncludeDatabaseDates<Package> | null
    packageStatus?: ItemPackageStatus
    romaneio?: IncludeDatabaseDates<Romaneio> | null
    romaneioDeleted?: boolean
    elementIndex?: number
    elementIndexTotal?: number
    complement?: boolean
    inactivateAt?: Date | null
}

export type Romaneio = {
    id: number
    squareMeters: string
    obraId: number | null
    productId: number | null
    userId: number | null
    notes: string | null
    tags: RomaneioTag[]
    items: IncludeDatabaseDates<Item>[]
    obra?: IncludeDatabaseDates<Obra> | null
    obraDeleted?: boolean
    product?: IncludeDatabaseDates<Product> | null
    productDeleted?: boolean
    clientId: number | null
    client?: IncludeDatabaseDates<Client> | null
    clientDeleted?: boolean
}

export type PackageWorkflowStatus = 'packaged' | 'in_transit' | 'delivered'

export type Package = {
    id?: number
    description?: string
    romaneioId: number | null
    deliveryId: number | null
    fixed: boolean
    items?: IncludeDatabaseDates<Item>[]
    romaneio?: IncludeDatabaseDates<Romaneio> | null
    romaneioDeleted?: boolean
    delivery?: IncludeDatabaseDates<Delivery> | null
    workflowStatus?: PackageWorkflowStatus
}

export type Document = {
    id?: number
    name: string
    description?: string
    image?: string
    userId: number | null
    deliveryId: number | null
}

export type Driver = {
    cpf: string
    name: string
    image?: string
}

export type Vehicle = {
    plate: string
    description?: string
    size?: string
}

export type Delivery = {
    id?: number
    scheduledTime: Date | null
    departureTime: Date | null
    deliveryTime: Date | null
    vehiclePlate?: string
    driverCpf?: string
    driver?: IncludeDatabaseDates<Driver> | null
    vehicle?: IncludeDatabaseDates<Vehicle> | null
    obras?: IncludeDatabaseDates<Obra>[]
    clients?: IncludeDatabaseDates<Client>[]
    packages?: IncludeDatabaseDates<Package>[]
    romaneios?: IncludeDatabaseDates<Romaneio>[]
    documents?: IncludeDatabaseDates<Document>[]
    notes?: string | null
}

export type Supplier = {
    id?: number
    name: string
    materials?: IncludeDatabaseDates<Material>[]
}

export type MaterialType = 'chapa' | 'chapa_especial' | 'ripa' | 'ripa_especial'
export const MaterialTypes: MaterialType[] = [
    'chapa',
    'chapa_especial',
    'ripa',
    'ripa_especial',
]

export type Material = {
    id?: number
    supplierId: number
    sku: string
    name: string
    description?: string
    type: MaterialType
    value: number
    supplier?: IncludeDatabaseDates<Supplier> | null
}

export type LockInformation = {
    isLocked: boolean
    lockedByUserId: number | null
    isLockedByAnotherUser: boolean
    lockedAt: Date | null
    timeLocked: number | null
    isTimeout: boolean
}

export type Profile = {
    id: number
    name: string
    description: string
    departments: string[]
    permissions: string[]
}