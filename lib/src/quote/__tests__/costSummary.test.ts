import { describe, expect, test } from 'vitest'
import type {
    QuoteFixedCost,
    QuoteGroupedElement,
    QuotePricingOption,
} from 'types/quote.js'
import { computeM2Totals, computeCostSummary } from '../costSummary.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeGroup = (
    category: string,
    totalM2: number,
    quantity = 0
): QuoteGroupedElement => ({
    category,
    elements: [],
    quantity,
    totalM2,
})

const priceFixedCost = (
    id: string,
    valueCentsPerM2: number
): QuoteFixedCost => ({
    id,
    name: id,
    valueType: 'price',
    value: valueCentsPerM2,
})

const percentageFixedCost = (id: string, rate: number): QuoteFixedCost => ({
    id,
    name: id,
    valueType: 'percentage',
    value: rate,
})

const pricingOption = (
    valueReto: number,
    valueCambotado: number,
    valueGarfo = 0
): QuotePricingOption => ({
    id: '1',
    name: 'Option A',
    valueReto,
    valueCambotado,
    valueGarfo,
})

// ── computeM2Totals ───────────────────────────────────────────────────────────

describe('computeM2Totals', () => {
    test('returns zero totals for empty groups', () => {
        const result = computeM2Totals({})
        expect(result.totalM2).toBe(0)
        expect(result.totalM2Reto).toBe(0)
        expect(result.totalM2Cambotado).toBe(0)
        expect(result.totalM2Garfo).toBe(0)
        expect(result.totalGarfoQuantity).toBe(0)
    })

    test('totalGarfoQuantity sums quantity for garfo-category groups only', () => {
        const groups = {
            'viga+2+garfo': makeGroup('viga+2+garfo', 6, 4),
            'pilar+1': makeGroup('pilar+1', 10, 7),
        }
        const result = computeM2Totals(groups)
        expect(result.totalGarfoQuantity).toBe(4)
    })

    test('classifies elements without cambotado or garfo as reto', () => {
        const groups = {
            'pilar+1': makeGroup('pilar+1', 10),
            'viga+2': makeGroup('viga+2', 5),
        }
        const result = computeM2Totals(groups)
        expect(result.totalM2Reto).toBe(15)
        expect(result.totalM2Cambotado).toBe(0)
        expect(result.totalM2Garfo).toBe(0)
        expect(result.totalM2).toBe(15)
    })

    test('classifies elements with cambotado modifier as cambotado', () => {
        const groups = {
            'pilar+1+cambotado': makeGroup('pilar+1+cambotado', 8),
            'viga+2+cambotado': makeGroup('viga+2+cambotado', 4),
        }
        const result = computeM2Totals(groups)
        expect(result.totalM2Reto).toBe(0)
        expect(result.totalM2Cambotado).toBe(12)
        expect(result.totalM2Garfo).toBe(0)
        expect(result.totalM2).toBe(12)
    })

    test('classifies elements with garfo modifier as garfo, not reto', () => {
        const groups = {
            'viga+2+garfo': makeGroup('viga+2+garfo', 6),
        }
        const result = computeM2Totals(groups)
        expect(result.totalM2Reto).toBe(0)
        expect(result.totalM2Cambotado).toBe(0)
        expect(result.totalM2Garfo).toBe(6)
        expect(result.totalM2).toBe(6)
    })

    test('element with both cambotado and garfo counts in both buckets', () => {
        const groups = {
            'viga+2+cambotado+garfo': makeGroup('viga+2+cambotado+garfo', 5),
        }
        const result = computeM2Totals(groups)
        expect(result.totalM2Reto).toBe(0)
        expect(result.totalM2Cambotado).toBe(5)
        expect(result.totalM2Garfo).toBe(5)
        expect(result.totalM2).toBe(5)
    })

    test('splits mixed reto, cambotado and garfo groups correctly', () => {
        const groups = {
            'pilar+1': makeGroup('pilar+1', 10),
            'pilar+1+cambotado': makeGroup('pilar+1+cambotado', 6),
            'viga+2': makeGroup('viga+2', 4),
            'viga+2+cambotado': makeGroup('viga+2+cambotado', 2),
            'viga+3+garfo': makeGroup('viga+3+garfo', 8),
        }
        const result = computeM2Totals(groups)
        expect(result.totalM2Reto).toBe(14)
        expect(result.totalM2Cambotado).toBe(8)
        expect(result.totalM2Garfo).toBe(8)
        expect(result.totalM2).toBe(30)
    })

    test('totalM2 is the sum of all unique group areas', () => {
        const groups = {
            'pilar+1': makeGroup('pilar+1', 7.5),
            'pilar+1+cambotado': makeGroup('pilar+1+cambotado', 3.25),
            'viga+2+garfo': makeGroup('viga+2+garfo', 2.0),
        }
        const result = computeM2Totals(groups)
        expect(result.totalM2).toBe(12.75)
    })
})

// ── computeCostSummary ────────────────────────────────────────────────────────

describe('computeCostSummary', () => {
    const retoGroups = {
        'pilar+1': makeGroup('pilar+1', 100),
    }
    const mixedGroups = {
        'pilar+1': makeGroup('pilar+1', 60),
        'pilar+1+cambotado': makeGroup('pilar+1+cambotado', 40),
    }
    const garfoGroups = {
        'pilar+1': makeGroup('pilar+1', 60),
        'pilar+1+cambotado': makeGroup('pilar+1+cambotado', 40),
        'viga+2+garfo': makeGroup('viga+2+garfo', 20, 20),
    }

    describe('fixedCostItems (price-type)', () => {
        test('computes value as fixedCost.value * totalM2', () => {
            const costs = [priceFixedCost('transport', 500)]
            const result = computeCostSummary({
                elementGroups: retoGroups,
                effectiveFixedCosts: costs,
            })
            // 500 cents/m2 * 100 m2 = 50000 cents
            expect(result.fixedCostItems[0].value).toBe(50000)
        })

        test('uses combined totalM2 (all buckets) for price costs', () => {
            const costs = [priceFixedCost('transport', 500)]
            const result = computeCostSummary({
                elementGroups: garfoGroups,
                effectiveFixedCosts: costs,
            })
            // 500 * (60 + 40 + 20) = 60000
            expect(result.fixedCostItems[0].value).toBe(60000)
        })

        test('computes percentage as share of fixedCostTotal', () => {
            const costs = [priceFixedCost('a', 200), priceFixedCost('b', 300)]
            const result = computeCostSummary({
                elementGroups: retoGroups,
                effectiveFixedCosts: costs,
            })
            // a = 200 * 100 = 20000, b = 300 * 100 = 30000, total = 50000
            expect(result.fixedCostItems[0].percentage).toBeCloseTo(0.4)
            expect(result.fixedCostItems[1].percentage).toBeCloseTo(0.6)
        })

        test('percentages sum to 1 when there are multiple items', () => {
            const costs = [
                priceFixedCost('a', 100),
                priceFixedCost('b', 150),
                priceFixedCost('c', 250),
            ]
            const result = computeCostSummary({
                elementGroups: retoGroups,
                effectiveFixedCosts: costs,
            })
            const sum = result.fixedCostItems.reduce(
                (s, i) => s + i.percentage,
                0
            )
            expect(sum).toBeCloseTo(1)
        })

        test('fixedCostTotal equals sum of item values', () => {
            const costs = [priceFixedCost('a', 200), priceFixedCost('b', 300)]
            const result = computeCostSummary({
                elementGroups: retoGroups,
                effectiveFixedCosts: costs,
            })
            expect(result.fixedCostTotal).toBe(50000)
        })

        test('excludes percentage-type costs from fixedCostItems', () => {
            const costs = [
                priceFixedCost('price1', 100),
                percentageFixedCost('pct1', 0.1),
            ]
            const result = computeCostSummary({
                elementGroups: retoGroups,
                effectiveFixedCosts: costs,
            })
            expect(result.fixedCostItems).toHaveLength(1)
            expect(result.fixedCostItems[0].id).toBe('price1')
        })
    })

    describe('variableCostItems (percentage-type)', () => {
        test('computes value as pricingGrandTotal * rate', () => {
            const option = pricingOption(5000, 7000, 3000)
            const costs = [percentageFixedCost('commission', 0.1)]
            const result = computeCostSummary({
                elementGroups: garfoGroups,
                effectiveFixedCosts: costs,
                selectedPricingOption: option,
            })
            // reto=5000*60=300000, cambotado=7000*40=280000, garfo=3000*20=60000, total=640000
            // commission = 640000 * 0.1 = 64000
            expect(result.variableCostItems[0].value).toBe(64000)
        })

        test('basePricingTotal matches pricingGrandTotal', () => {
            const option = pricingOption(5000, 7000)
            const costs = [
                percentageFixedCost('tax', 0.05),
                percentageFixedCost('commission', 0.1),
            ]
            const result = computeCostSummary({
                elementGroups: mixedGroups,
                effectiveFixedCosts: costs,
                selectedPricingOption: option,
            })
            expect(result.variableCostItems[0].basePricingTotal).toBe(
                result.pricingGrandTotal
            )
            expect(result.variableCostItems[1].basePricingTotal).toBe(
                result.pricingGrandTotal
            )
        })

        test('percentages sum to 1 across variable items', () => {
            const option = pricingOption(5000, 7000)
            const costs = [
                percentageFixedCost('a', 0.05),
                percentageFixedCost('b', 0.1),
                percentageFixedCost('c', 0.15),
            ]
            const result = computeCostSummary({
                elementGroups: mixedGroups,
                effectiveFixedCosts: costs,
                selectedPricingOption: option,
            })
            const sum = result.variableCostItems.reduce(
                (s, i) => s + i.percentage,
                0
            )
            expect(sum).toBeCloseTo(1)
        })

        test('value is 0 when no pricing option selected', () => {
            const costs = [percentageFixedCost('commission', 0.1)]
            const result = computeCostSummary({
                elementGroups: retoGroups,
                effectiveFixedCosts: costs,
            })
            expect(result.variableCostItems[0].value).toBe(0)
        })

        test('excludes price-type costs from variableCostItems', () => {
            const option = pricingOption(5000, 7000)
            const costs = [
                priceFixedCost('price1', 100),
                percentageFixedCost('pct1', 0.1),
            ]
            const result = computeCostSummary({
                elementGroups: retoGroups,
                effectiveFixedCosts: costs,
                selectedPricingOption: option,
            })
            expect(result.variableCostItems).toHaveLength(1)
            expect(result.variableCostItems[0].id).toBe('pct1')
        })
    })

    describe('pricing totals', () => {
        test('computes pricing totals per bucket', () => {
            const option = pricingOption(5000, 7000, 3000)
            const result = computeCostSummary({
                elementGroups: garfoGroups,
                effectiveFixedCosts: [],
                selectedPricingOption: option,
            })
            expect(result.pricingTotalReto).toBe(300000) // 5000 * 60
            expect(result.pricingTotalCambotado).toBe(280000) // 7000 * 40
            expect(result.pricingTotalGarfo).toBe(60000) // 3000 * 20
            expect(result.pricingGrandTotal).toBe(640000)
        })

        test('pricingGrandTotal excludes garfo when valueGarfo is 0', () => {
            const option = pricingOption(5000, 7000, 0)
            const result = computeCostSummary({
                elementGroups: mixedGroups,
                effectiveFixedCosts: [],
                selectedPricingOption: option,
            })
            expect(result.pricingTotalReto).toBe(300000) // 5000 * 60
            expect(result.pricingTotalCambotado).toBe(280000) // 7000 * 40
            expect(result.pricingTotalGarfo).toBe(0)
            expect(result.pricingGrandTotal).toBe(580000)
        })

        test('pricingTotalGarfo is based on piece quantity, not m2', () => {
            const option = pricingOption(5000, 7000, 3000)
            const groups = {
                'pilar+1': makeGroup('pilar+1', 60),
                // garfo m2 is always 0 in practice (computed elements carry no area),
                // but the piece quantity must still drive the garfo pricing bucket
                'viga+2+garfo': makeGroup('viga+2+garfo', 0, 8),
            }
            const result = computeCostSummary({
                elementGroups: groups,
                effectiveFixedCosts: [],
                selectedPricingOption: option,
            })
            expect(result.pricingTotalGarfo).toBe(24000) // 3000 * 8
        })

        test('returns zero pricing totals when no option selected', () => {
            const result = computeCostSummary({
                elementGroups: retoGroups,
                effectiveFixedCosts: [],
            })
            expect(result.pricingTotalReto).toBe(0)
            expect(result.pricingTotalCambotado).toBe(0)
            expect(result.pricingTotalGarfo).toBe(0)
            expect(result.pricingGrandTotal).toBe(0)
        })
    })

    describe('empty / edge cases', () => {
        test('handles no fixed costs', () => {
            const result = computeCostSummary({
                elementGroups: retoGroups,
                effectiveFixedCosts: [],
            })
            expect(result.fixedCostItems).toHaveLength(0)
            expect(result.fixedCostTotal).toBe(0)
            expect(result.variableCostItems).toHaveLength(0)
            expect(result.variableCostTotal).toBe(0)
        })

        test('sets percentage to 0 when table total is 0', () => {
            // price costs with 0 totalM2 → all values = 0 → percentages should be 0 not NaN
            const result = computeCostSummary({
                elementGroups: {},
                effectiveFixedCosts: [priceFixedCost('a', 500)],
            })
            expect(result.fixedCostItems[0].percentage).toBe(0)
        })
    })
})
