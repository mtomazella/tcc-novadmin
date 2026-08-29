import type { Product, MaterialType } from '../types/entity.js'
import type { Quote, QuoteGroupedElement, QuoteScope } from '../types/quote.js'
import {
    getOverriddenMaterialSelectionValue,
    getOverriddenProductConsumption,
} from './overrides.js'

export const getMaterialSelectionKey = ({
    materialType,
    category,
}: {
    materialType: MaterialType
    category: string
}) => {
    return `${materialType}-${category}`
}

export type IcKey = 'icChapa1' | 'icChapa2' | 'icRipa1' | 'icRipa2'

export const materialTypeToIcKey: Record<MaterialType, IcKey> = {
    chapa: 'icChapa1',
    chapa_especial: 'icChapa2',
    ripa: 'icRipa1',
    ripa_especial: 'icRipa2',
}

export type QuoteMaterialEntry = {
    scopeId: number
    scopeName: string
    materialType: MaterialType
    category: string
    categoryName?: string
    materialName: string
    totalM2: number
    quantity: number | null
    unitValue: number
    totalValue: number | null
}

export type QuoteMaterialAggregatedEntry = {
    materialType: MaterialType
    category: string
    categoryName?: string
    totalM2: number
    quantity: number | null
    totalValue: number | null
}

export const aggregateMaterialEntriesByCategory = (
    entries: QuoteMaterialEntry[]
): QuoteMaterialAggregatedEntry[] => {
    const byKey = new Map<string, QuoteMaterialAggregatedEntry>()

    for (const entry of entries) {
        const key = `${entry.materialType}-${entry.category}`
        const existing = byKey.get(key)
        if (existing) {
            existing.totalM2 += entry.totalM2
            existing.quantity =
                existing.quantity !== null || entry.quantity !== null
                    ? (existing.quantity ?? 0) + (entry.quantity ?? 0)
                    : null
            existing.totalValue =
                existing.totalValue !== null || entry.totalValue !== null
                    ? (existing.totalValue ?? 0) + (entry.totalValue ?? 0)
                    : null
        } else {
            byKey.set(key, {
                materialType: entry.materialType,
                category: entry.category,
                categoryName: entry.categoryName,
                totalM2: entry.totalM2,
                quantity: entry.quantity,
                totalValue: entry.totalValue,
            })
        }
    }

    return Array.from(byKey.values())
}

export const calculateTotalMaterialCost = (
    entries: QuoteMaterialEntry[]
): number =>
    entries.reduce((total, entry) => total + (entry.totalValue ?? 0), 0)

export const calculateQuoteMaterialSummary = ({
    scopes,
    elementGroupsByScope,
    quote,
}: {
    scopes: QuoteScope[]
    elementGroupsByScope: Record<number, Record<string, QuoteGroupedElement>>
    quote?: Quote
}): QuoteMaterialEntry[] => {
    const entries: QuoteMaterialEntry[] = []

    for (const scope of scopes) {
        if (!scope.id) continue
        const groupsByCategory = elementGroupsByScope[scope.id] ?? {}

        for (const selection of scope.materialSelections) {
            const group = groupsByCategory[selection.category]
            if (!group) continue

            const snapshot = scope.materials[String(selection.materialId)]
            if (!snapshot) continue

            const product = group.elements[0]?.product
            if (!product) continue

            const unitValue = getOverriddenMaterialSelectionValue({
                material: snapshot,
                scope,
                category: selection.category,
                overriddenLevel: 'scope_selection',
            })

            const totalM2 = group.totalM2 ?? 0

            const icKey = materialTypeToIcKey[selection.materialType]
            const effectiveConsumption = getOverriddenProductConsumption({
                product: product as unknown as Product,
                quote,
                scope,
                overrideLevel: quote ? 'scope' : 'product',
            })
            const ic = effectiveConsumption.consumptionRates[icKey] ?? null
            const isRipaType =
                selection.materialType === 'ripa' ||
                selection.materialType === 'ripa_especial'
            const quantity =
                ic !== null && ic !== 0
                    ? isRipaType
                        ? totalM2 * ic
                        : totalM2 / ic
                    : null
            const totalValue = quantity !== null ? quantity * unitValue : null

            entries.push({
                scopeId: scope.id,
                scopeName: scope.name,
                materialType: selection.materialType,
                category: selection.category,
                categoryName: group.categoryName,
                materialName: snapshot.name,
                totalM2,
                quantity,
                unitValue,
                totalValue,
            })
        }
    }

    return entries
}
