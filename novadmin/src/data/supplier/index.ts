import {
    SnakeCaseKeys,
    IncludeDatabaseDates,
    Supplier,
} from '@novadmin/lib/types'
import {
    DatabaseMaterial,
    formatFromDatabase as formatMaterialFromDatabase,
} from 'data/material'

export type DatabaseSupplier = SnakeCaseKeys<IncludeDatabaseDates<Supplier>>

export type UpsertSupplierRecord = Supplier

export type SupplierFuzzyFields =
    | 'name'
    | 'material_sku'
    | 'material_name'
    | 'material_description'

export const formatFromDatabase = (
    supplier: DatabaseSupplier
): IncludeDatabaseDates<Supplier> => {
    const newRecord: any = {
        ...supplier,
        createdAt: supplier.created_at,
        updatedAt: supplier.updated_at,
        deletedAt: supplier.deleted_at,
    }

    if (supplier.materials) {
        newRecord.materials = (
            supplier.materials as unknown as DatabaseMaterial[]
        ).map(formatMaterialFromDatabase)
    }

    delete (newRecord as any).total_count
    delete (newRecord as any).created_at
    delete (newRecord as any).updated_at
    delete (newRecord as any).deleted_at
    return newRecord
}

export * from './list'
export * from './upsert'
export * from './remove'
