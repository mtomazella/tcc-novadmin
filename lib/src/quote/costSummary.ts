import type {
    QuoteFixedCost,
    QuoteGroupedElement,
    QuotePricingOption,
} from '../types/quote.js'
import { splitCategory } from './groupedElements.js'
import { normalizeNumber } from '../utils/unitConversion.js'

export type FixedCostSummaryItem = {
    id: string
    name: string
    base: number | null // m² used as multiplier; null for flat or computed costs
    value: number // cents
    percentage: number // 0–1
}

export type VariableCostSummaryItem = {
    id: string
    name: string
    basePricingTotal: number // cents — total from selected pricing option
    rate: number // 0–1
    value: number // cents
    percentage: number // 0–1
}

export type CostSummaryResult = {
    totalM2: number
    totalM2Reto: number
    totalM2Cambotado: number
    totalM2Garfo: number
    totalGarfoQuantity: number // pieces, not m² — garfo elements carry no area

    pricingTotalReto: number // cents
    pricingTotalCambotado: number // cents
    pricingTotalGarfo: number // cents
    pricingGrandTotal: number // cents

    fixedCostItems: FixedCostSummaryItem[]
    fixedCostTotal: number // cents

    variableCostItems: VariableCostSummaryItem[]
    variableCostTotal: number // cents
}

export const computeM2Totals = (
    elementGroups: Record<string, QuoteGroupedElement>
): {
    totalM2: number
    totalM2Reto: number
    totalM2Cambotado: number
    totalM2Garfo: number
    totalGarfoQuantity: number
} => {
    let totalM2Reto = 0
    let totalM2Cambotado = 0
    let totalM2Garfo = 0
    let totalGarfoQuantity = 0
    let totalM2 = 0

    for (const group of Object.values(elementGroups)) {
        const { modifiers } = splitCategory(group.category)
        const m2 = normalizeNumber(group.totalM2)
        totalM2 += m2
        if (modifiers.cambotado) totalM2Cambotado += m2
        if (modifiers.garfo) {
            totalM2Garfo += m2
            totalGarfoQuantity += normalizeNumber(group.quantity)
        }
        if (!modifiers.cambotado && !modifiers.garfo) totalM2Reto += m2
    }

    return {
        totalM2,
        totalM2Reto,
        totalM2Cambotado,
        totalM2Garfo,
        totalGarfoQuantity,
    }
}

export const computeProductionCostPerM2 = (
    result: CostSummaryResult
): number => {
    if (result.totalM2 === 0) return 0
    return (result.fixedCostTotal + result.variableCostTotal) / result.totalM2
}

const FLAT_COST_IDS = new Set(['diversos'])
const PROJECT_PRICE_COST_IDS = new Set(['projeto'])

export const computeCostSummary = ({
    elementGroups,
    effectiveFixedCosts,
    selectedPricingOption,
    computedFixedCosts = [],
    totalProjectM2 = 0,
}: {
    elementGroups: Record<string, QuoteGroupedElement>
    effectiveFixedCosts: QuoteFixedCost[]
    selectedPricingOption?: QuotePricingOption
    computedFixedCosts?: Array<{ id: string; name: string; value: number }>
    totalProjectM2?: number
}): CostSummaryResult => {
    const {
        totalM2,
        totalM2Reto,
        totalM2Cambotado,
        totalM2Garfo,
        totalGarfoQuantity,
    } = computeM2Totals(elementGroups)

    const pricingTotalReto = selectedPricingOption
        ? normalizeNumber(selectedPricingOption.valueReto) * totalM2Reto
        : 0
    const pricingTotalCambotado = selectedPricingOption
        ? normalizeNumber(selectedPricingOption.valueCambotado) *
          totalM2Cambotado
        : 0
    const pricingTotalGarfo = selectedPricingOption
        ? normalizeNumber(selectedPricingOption.valueGarfo) * totalGarfoQuantity
        : 0
    const pricingGrandTotal =
        pricingTotalReto + pricingTotalCambotado + pricingTotalGarfo

    const priceCosts = effectiveFixedCosts.filter(
        (c) => c.valueType === 'price'
    )
    const percentageCosts = effectiveFixedCosts.filter(
        (c) => c.valueType === 'percentage'
    )

    const rawFixedItems = [
        ...priceCosts.map((c) => {
            let value: number
            let base: number | null
            if (FLAT_COST_IDS.has(c.id)) {
                value = normalizeNumber(c.value)
                base = null
            } else if (PROJECT_PRICE_COST_IDS.has(c.id)) {
                value = normalizeNumber(c.value) * totalProjectM2
                base = totalProjectM2
            } else {
                value = normalizeNumber(c.value) * totalM2
                base = totalM2
            }
            return { id: c.id, name: c.name, base, value, percentage: 0 }
        }),
        ...computedFixedCosts.map((c) => ({
            ...c,
            base: null as null,
            percentage: 0,
        })),
    ]
    const fixedCostTotal = rawFixedItems.reduce(
        (sum, item) => sum + item.value,
        0
    )
    const fixedCostItems: FixedCostSummaryItem[] = rawFixedItems.map(
        (item) => ({
            ...item,
            percentage: fixedCostTotal > 0 ? item.value / fixedCostTotal : 0,
        })
    )

    const rawVariableItems = percentageCosts.map((c) => ({
        id: c.id,
        name: c.name,
        basePricingTotal: pricingGrandTotal,
        rate: normalizeNumber(c.value),
        value: pricingGrandTotal * normalizeNumber(c.value),
        percentage: 0,
    }))
    const variableCostTotal = rawVariableItems.reduce(
        (sum, item) => sum + item.value,
        0
    )
    const variableCostItems: VariableCostSummaryItem[] = rawVariableItems.map(
        (item) => ({
            ...item,
            percentage:
                variableCostTotal > 0 ? item.value / variableCostTotal : 0,
        })
    )

    return {
        totalM2,
        totalM2Reto,
        totalM2Cambotado,
        totalM2Garfo,
        totalGarfoQuantity,
        pricingTotalReto,
        pricingTotalCambotado,
        pricingTotalGarfo,
        pricingGrandTotal,
        fixedCostItems,
        fixedCostTotal,
        variableCostItems,
        variableCostTotal,
    }
}
