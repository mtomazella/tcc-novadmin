import { describe, expect, test } from 'vitest'
import type { QuotePricingOption } from 'types/index.js'
import {
    generateNextPricingOptionId,
    generateNextQuoteSpecificOptionId,
    toQuotePricingOptionRows,
} from '../pricingOptions.js'

const makeOption = (
    id: string,
    name: string,
    valueReto = 10000,
    valueCambotado = 20000,
    valueGarfo = 15000
): QuotePricingOption => ({ id, name, valueReto, valueCambotado, valueGarfo })

describe('generateNextPricingOptionId', () => {
    test('returns 1 for empty array', () => {
        expect(generateNextPricingOptionId([])).toBe(1)
    })

    test('returns max numeric id + 1', () => {
        expect(
            generateNextPricingOptionId([
                makeOption('3', 'A'),
                makeOption('1', 'B'),
                makeOption('5', 'C'),
            ])
        ).toBe(6)
    })

    test('ignores options with no id', () => {
        const options: QuotePricingOption[] = [
            { name: 'No ID', valueReto: 0, valueCambotado: 0, valueGarfo: 0 },
            makeOption('2', 'With ID'),
        ]
        expect(generateNextPricingOptionId(options)).toBe(3)
    })

    test('ignores non-numeric string ids', () => {
        const options: QuotePricingOption[] = [
            makeOption('2', 'Global'),
            {
                id: 'quote-5',
                name: 'Specific',
                valueReto: 0,
                valueCambotado: 0,
                valueGarfo: 0,
            },
        ]
        expect(generateNextPricingOptionId(options)).toBe(3)
    })
})

describe('generateNextQuoteSpecificOptionId', () => {
    test('returns quote-1 for empty array', () => {
        expect(generateNextQuoteSpecificOptionId([])).toBe('quote-1')
    })

    test('returns quote-N+1 based on existing quote- ids', () => {
        const options: QuotePricingOption[] = [
            makeOption('1', 'Global'),
            {
                id: 'quote-3',
                name: 'Specific',
                valueReto: 0,
                valueCambotado: 0,
                valueGarfo: 0,
            },
        ]
        expect(generateNextQuoteSpecificOptionId(options)).toBe('quote-4')
    })

    test('ignores non-quote- string ids', () => {
        const options: QuotePricingOption[] = [makeOption('100', 'Global')]
        expect(generateNextQuoteSpecificOptionId(options)).toBe('quote-1')
    })
})

describe('toQuotePricingOptionRows', () => {
    test('returns empty array when both inputs are empty', () => {
        expect(
            toQuotePricingOptionRows({
                basePricingOptions: [],
                overriddenPricingOptions: [],
            })
        ).toEqual([])
    })

    test('returns global options when no overrides exist', () => {
        const base = [makeOption('1', 'Padrão', 10000, 20000, 15000)]
        const rows = toQuotePricingOptionRows({
            basePricingOptions: base,
            overriddenPricingOptions: [],
        })

        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
            id: '1',
            name: 'Padrão',
            valueReto: 10000,
            valueCambotado: 20000,
            valueGarfo: 15000,
            baseValueReto: 10000,
            baseValueCambotado: 20000,
            baseValueGarfo: 15000,
            isQuoteSpecific: false,
        })
    })

    test('applies override values when override matches global id', () => {
        const base = [makeOption('1', 'Padrão', 10000, 20000, 15000)]
        const override: QuotePricingOption = {
            id: '1',
            name: 'Padrão',
            valueReto: 12000,
            valueCambotado: 20000,
            valueGarfo: 15000,
        }

        const rows = toQuotePricingOptionRows({
            basePricingOptions: base,
            overriddenPricingOptions: [override],
        })

        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
            id: '1',
            valueReto: 12000,
            valueCambotado: 20000,
            valueGarfo: 15000,
            baseValueReto: 10000,
            baseValueCambotado: 20000,
            baseValueGarfo: 15000,
            isQuoteSpecific: false,
        })
    })

    test('mix: some global overridden, some not', () => {
        const base = [
            makeOption('1', 'Padrão', 10000, 20000, 15000),
            makeOption('2', 'Premium', 30000, 40000, 35000),
        ]
        const override: QuotePricingOption = {
            id: '1',
            name: 'Padrão',
            valueReto: 12000,
            valueCambotado: 20000,
            valueGarfo: 15000,
        }

        const rows = toQuotePricingOptionRows({
            basePricingOptions: base,
            overriddenPricingOptions: [override],
        })

        expect(rows).toHaveLength(2)
        expect(rows[0].id).toBe('1')
        expect(rows[0].valueReto).toBe(12000)
        expect(rows[1].id).toBe('2')
        expect(rows[1].valueReto).toBe(30000)
        expect(rows[1].baseValueReto).toBe(30000)
    })

    test('quote-specific option with string id not matching any global', () => {
        const base = [makeOption('1', 'Padrão')]
        const quoteSpecific: QuotePricingOption = {
            id: 'quote-1',
            name: 'Especial',
            valueReto: 5000,
            valueCambotado: 6000,
            valueGarfo: 4000,
        }

        const rows = toQuotePricingOptionRows({
            basePricingOptions: base,
            overriddenPricingOptions: [quoteSpecific],
        })

        expect(rows).toHaveLength(2)
        const special = rows.find((r) => r.id === 'quote-1')!
        expect(special.isQuoteSpecific).toBe(true)
        expect(special.baseValueReto).toBeUndefined()
    })

    test('quote-specific option with no id gets generated quote- id', () => {
        const base = [makeOption('5', 'Padrão')]
        const noIdOption: QuotePricingOption = {
            name: 'Sem ID',
            valueReto: 1000,
            valueCambotado: 2000,
            valueGarfo: 1500,
        }

        const rows = toQuotePricingOptionRows({
            basePricingOptions: base,
            overriddenPricingOptions: [noIdOption],
        })

        expect(rows).toHaveLength(2)
        const special = rows.find((r) => r.isQuoteSpecific)!
        expect(typeof special.id).toBe('string')
        expect(special.id.startsWith('quote-')).toBe(true)
        expect(special.name).toBe('Sem ID')
        expect(special.isQuoteSpecific).toBe(true)
    })

    test('global options without id are skipped', () => {
        const base: QuotePricingOption[] = [
            { name: 'Sem ID', valueReto: 0, valueCambotado: 0, valueGarfo: 0 },
        ]
        const rows = toQuotePricingOptionRows({
            basePricingOptions: base,
            overriddenPricingOptions: [],
        })
        expect(rows).toHaveLength(0)
    })

    test('override order preserved for global options (follows global order)', () => {
        const base = [makeOption('2', 'B'), makeOption('1', 'A')]
        const rows = toQuotePricingOptionRows({
            basePricingOptions: base,
            overriddenPricingOptions: [],
        })
        expect(rows[0].id).toBe('2')
        expect(rows[1].id).toBe('1')
    })
})
