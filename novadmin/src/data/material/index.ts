import {
    SnakeCaseKeys,
    IncludeDatabaseDates,
    Material,
} from '@novadmin/lib/types'
import {
    DatabaseSupplier,
    formatFromDatabase as formatSupplierFromDatabase,
} from 'data/supplier'

export type DatabaseMaterial = SnakeCaseKeys<IncludeDatabaseDates<Material>>

export type UpsertMaterialRecord = Material

export type MaterialFuzzyFields =
    | 'sku'
    | 'name'
    | 'description'
    | 'supplier_name'

export const formatFromDatabase = (
    material: DatabaseMaterial
): IncludeDatabaseDates<Material> => {
    const newRecord: IncludeDatabaseDates<Material> = {
        ...material,
        supplierId: material.supplier_id,
        createdAt: material.created_at,
        updatedAt: material.updated_at,
        deletedAt: material.deleted_at,
    }

    if (material.supplier) {
        newRecord.supplier = formatSupplierFromDatabase(
            material.supplier as IncludeDatabaseDates<DatabaseSupplier>
        )
    }

    delete (newRecord as any).total_count
    delete (newRecord as any).supplier_id
    delete (newRecord as any).created_at
    delete (newRecord as any).updated_at
    delete (newRecord as any).deleted_at
    return newRecord
}

export * from './list'
export * from './upsert'
export * from './remove'
