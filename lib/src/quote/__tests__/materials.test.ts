import { describe, expect, test } from 'vitest'
import type { Product } from 'types/entity.js'
import type {
    Quote,
    QuoteElement,
    QuoteGroupedElement,
    QuoteScope,
} from 'types/index.js'
import { calculateQuoteMaterialSummary } from '../materials.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeProduct = (
    id: number,
    rates: Partial<{
        icChapa1: number | null
        icChapa2: number | null
        icRipa1: number | null
        icRipa2: number | null
        icChapa3: number | null
        icRipa3: number | null
    }> = {}
): Product =>
    ({
        id,
        name: 'Produto',
        modifiers: {
            cambotado: false,
            ripado: false,
            aparente: false,
            paginado: false,
            needsGarfo: false,
            needsGastalho: false,
            garfo: false,
            gastalho: false,
            fundoDeViga: false,
        },
        commercialPercentage: null,
        projectPercentage: null,
        consumptionRates: {
            icChapa1: 2.5,
            icRipa1: 3,
            icChapa2: 2,
            icRipa2: 2.5,
            icChapa3: null,
            icRipa3: null,
            ...rates,
        },
    }) as Product

const makeElement = (productId: number, scopeId: number): QuoteElement =>
    ({
        quoteId: 1,
        scopeId,
        productId,
        type: 'pilar',
        name: 'Elemento',
        values: {} as any,
        product: makeProduct(productId),
    }) as QuoteElement

const makeGroup = (
    overrides: Partial<QuoteGroupedElement> & { category: string }
): QuoteGroupedElement => ({
    elements: [makeElement(5, 1)],
    quantity: 2,
    totalM2: 10,
    ...overrides,
})

const makeScope = (
    overrides: Partial<QuoteScope> & { id: number; name: string }
): QuoteScope =>
    ({
        quoteId: 1,
        overriddenFixedCosts: [],
        overriddenProductConsumption: [],
        materials: {},
        materialSelections: [],
        ...overrides,
    }) as QuoteScope

// ── Tests ────────────────────────────────────────────────────────────────────

describe('calculateQuoteMaterialSummary', () => {
    test('returns empty array for empty scopes', () => {
        expect(
            calculateQuoteMaterialSummary({
                scopes: [],
                elementGroupsByScope: {},
            })
        ).toEqual([])
    })

    test('returns empty array when scope has no materialSelections', () => {
        const scope = makeScope({
            id: 1,
            name: 'Escopo A',
            materialSelections: [],
        })
        expect(
            calculateQuoteMaterialSummary({
                scopes: [scope],
                elementGroupsByScope: {
                    1: { 'pilar+5': makeGroup({ category: 'pilar+5' }) },
                },
            })
        ).toEqual([])
    })

    test('skips entry when group for category does not exist', () => {
        const scope = makeScope({
            id: 1,
            name: 'Escopo A',
            materials: {
                '7': {
                    id: 7,
                    supplierId: 1,
                    sku: 'CH-001',
                    name: 'Chapa',
                    type: 'chapa',
                    value: 5000,
                },
            },
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'pilar+5',
                    materialType: 'chapa',
                    materialId: 7,
                    overrides: {},
                },
            ],
        })
        expect(
            calculateQuoteMaterialSummary({
                scopes: [scope],
                elementGroupsByScope: { 1: {} },
            })
        ).toHaveLength(0)
    })

    test('skips entry when snapshot is missing', () => {
        const scope = makeScope({
            id: 1,
            name: 'Escopo A',
            materials: {},
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'pilar+5',
                    materialType: 'chapa',
                    materialId: 7,
                    overrides: {},
                },
            ],
        })
        expect(
            calculateQuoteMaterialSummary({
                scopes: [scope],
                elementGroupsByScope: {
                    1: { 'pilar+5': makeGroup({ category: 'pilar+5' }) },
                },
            })
        ).toHaveLength(0)
    })

    test('skips entry when group has no product in elements', () => {
        const scope = makeScope({
            id: 1,
            name: 'Escopo A',
            materials: {
                '7': {
                    id: 7,
                    supplierId: 1,
                    sku: 'CH-001',
                    name: 'Chapa',
                    type: 'chapa',
                    value: 5000,
                },
            },
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'pilar+5',
                    materialType: 'chapa',
                    materialId: 7,
                    overrides: {},
                },
            ],
        })
        const groupNoProduct = makeGroup({ category: 'pilar+5', elements: [] })
        expect(
            calculateQuoteMaterialSummary({
                scopes: [scope],
                elementGroupsByScope: { 1: { 'pilar+5': groupNoProduct } },
            })
        ).toHaveLength(0)
    })

    test('calculates quantity = totalM2 / ic and totalValue = quantity * unitValue', () => {
        const scope = makeScope({
            id: 1,
            name: 'Escopo A',
            materials: {
                '7': {
                    id: 7,
                    supplierId: 1,
                    sku: 'CH-001',
                    name: 'Chapa Padrão',
                    type: 'chapa',
                    value: 5000,
                },
            },
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'pilar+5',
                    materialType: 'chapa',
                    materialId: 7,
                    overrides: {},
                },
            ],
        })
        // product.icChapa1 = 2.5 (from makeProduct default), totalM2 = 20
        const group = makeGroup({
            category: 'pilar+5',
            categoryName: 'Produto X',
            totalM2: 20,
        })

        const result = calculateQuoteMaterialSummary({
            scopes: [scope],
            elementGroupsByScope: { 1: { 'pilar+5': group } },
        })

        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject({
            scopeId: 1,
            scopeName: 'Escopo A',
            materialType: 'chapa',
            category: 'pilar+5',
            categoryName: 'Produto X',
            materialName: 'Chapa Padrão',
            totalM2: 20,
            quantity: 8, // 20 / 2.5
            unitValue: 5000,
            totalValue: 40000, // 8 * 5000
        })
    })

    test('ripa uses icRipa1 and multiplies (totalM2 * ic)', () => {
        const snapshot = {
            id: 7,
            supplierId: 1,
            sku: 'RI-001',
            name: 'Ripa',
            type: 'ripa' as const,
            value: 2000,
        }
        const scope = makeScope({
            id: 1,
            name: 'Escopo A',
            materials: { '7': snapshot },
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'pilar+5',
                    materialType: 'ripa',
                    materialId: 7,
                    overrides: {},
                },
            ],
        })
        // product.icRipa1 = 3 (from makeProduct default), totalM2 = 9
        const group = makeGroup({ category: 'pilar+5', totalM2: 9 })

        const [entry] = calculateQuoteMaterialSummary({
            scopes: [scope],
            elementGroupsByScope: { 1: { 'pilar+5': group } },
        })

        expect(entry.quantity).toBe(27) // 9 * 3
        expect(entry.totalValue).toBe(54000) // 27 * 2000
    })

    test('ripa_especial uses icRipa2 and multiplies (totalM2 * ic)', () => {
        const snapshot = {
            id: 9,
            supplierId: 1,
            sku: 'RI-ESP',
            name: 'Ripa Especial',
            type: 'ripa_especial' as const,
            value: 3000,
        }
        const scope = makeScope({
            id: 1,
            name: 'Escopo A',
            materials: { '9': snapshot },
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'pilar+5',
                    materialType: 'ripa_especial',
                    materialId: 9,
                    overrides: {},
                },
            ],
        })
        // product.icRipa2 = 2.5 (from makeProduct default), totalM2 = 8
        const group = makeGroup({ category: 'pilar+5', totalM2: 8 })

        const [entry] = calculateQuoteMaterialSummary({
            scopes: [scope],
            elementGroupsByScope: { 1: { 'pilar+5': group } },
        })

        expect(entry.quantity).toBe(20) // 8 * 2.5
        expect(entry.totalValue).toBe(60000) // 20 * 3000
    })

    test('chapa_especial uses icChapa2', () => {
        const snapshot = {
            id: 8,
            supplierId: 1,
            sku: 'CH-ESP',
            name: 'Chapa Especial',
            type: 'chapa_especial' as const,
            value: 8000,
        }
        const scope = makeScope({
            id: 1,
            name: 'Escopo A',
            materials: { '8': snapshot },
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'pilar+5',
                    materialType: 'chapa_especial',
                    materialId: 8,
                    overrides: {},
                },
            ],
        })
        // product.icChapa2 = 2 (from makeProduct default), totalM2 = 10
        const group = makeGroup({ category: 'pilar+5', totalM2: 10 })

        const [entry] = calculateQuoteMaterialSummary({
            scopes: [scope],
            elementGroupsByScope: { 1: { 'pilar+5': group } },
        })

        expect(entry.quantity).toBe(5) // 10 / 2
        expect(entry.totalValue).toBe(40000) // 5 * 8000
    })

    test('quantity and totalValue are null when IC is null', () => {
        const snapshot = {
            id: 7,
            supplierId: 1,
            sku: 'CH-001',
            name: 'Chapa',
            type: 'chapa' as const,
            value: 5000,
        }
        const scope = makeScope({
            id: 1,
            name: 'Escopo A',
            materials: { '7': snapshot },
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'pilar+5',
                    materialType: 'chapa',
                    materialId: 7,
                    overrides: {},
                },
            ],
        })
        // Override icChapa1 to null
        const productNullIc = makeProduct(5, { icChapa1: null })
        const group = makeGroup({
            category: 'pilar+5',
            elements: [{ ...makeElement(5, 1), product: productNullIc as any }],
        })

        const [entry] = calculateQuoteMaterialSummary({
            scopes: [scope],
            elementGroupsByScope: { 1: { 'pilar+5': group } },
        })

        expect(entry.quantity).toBeNull()
        expect(entry.totalValue).toBeNull()
    })

    test('quantity and totalValue are null when IC is zero', () => {
        const snapshot = {
            id: 7,
            supplierId: 1,
            sku: 'CH-001',
            name: 'Chapa',
            type: 'chapa' as const,
            value: 5000,
        }
        const scope = makeScope({
            id: 1,
            name: 'Escopo A',
            materials: { '7': snapshot },
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'pilar+5',
                    materialType: 'chapa',
                    materialId: 7,
                    overrides: {},
                },
            ],
        })
        const productZeroIc = makeProduct(5, { icChapa1: 0 })
        const group = makeGroup({
            category: 'pilar+5',
            elements: [{ ...makeElement(5, 1), product: productZeroIc as any }],
        })

        const [entry] = calculateQuoteMaterialSummary({
            scopes: [scope],
            elementGroupsByScope: { 1: { 'pilar+5': group } },
        })

        expect(entry.quantity).toBeNull()
        expect(entry.totalValue).toBeNull()
    })

    test('applies scope selection value override to unitValue', () => {
        const scope = makeScope({
            id: 1,
            name: 'Escopo A',
            materials: {
                '7': {
                    id: 7,
                    supplierId: 1,
                    sku: 'CH-001',
                    name: 'Chapa',
                    type: 'chapa',
                    value: 5000,
                },
            },
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'pilar+5',
                    materialType: 'chapa',
                    materialId: 7,
                    overrides: { value: 3000 },
                },
            ],
        })
        const group = makeGroup({ category: 'pilar+5', totalM2: 10 })

        const [entry] = calculateQuoteMaterialSummary({
            scopes: [scope],
            elementGroupsByScope: { 1: { 'pilar+5': group } },
        })

        // icChapa1=2.5, totalM2=10 → quantity=4; unitValue=3000 (overridden); totalValue=12000
        expect(entry.unitValue).toBe(3000)
        expect(entry.quantity).toBe(4)
        expect(entry.totalValue).toBe(12000)
    })

    test('applies quote-level IC override when quote is provided', () => {
        const snapshot = {
            id: 7,
            supplierId: 1,
            sku: 'CH-001',
            name: 'Chapa',
            type: 'chapa' as const,
            value: 5000,
        }
        const scope = makeScope({
            id: 1,
            name: 'Escopo A',
            materials: { '7': snapshot },
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'pilar+5',
                    materialType: 'chapa',
                    materialId: 7,
                    overrides: {},
                },
            ],
        })
        const quote = {
            productConsumption: [
                {
                    id: 1,
                    category: 'pilar+5',
                    commercialPercentage: null,
                    projectPercentage: null,
                    consumptionRates: {
                        icChapa1: 5,
                        icRipa1: null,
                        icChapa2: null,
                        icRipa2: null,
                        icChapa3: null,
                        icRipa3: null,
                    },
                },
            ],
        } as unknown as Quote
        const group = makeGroup({ category: 'pilar+5', totalM2: 10 })

        const [entry] = calculateQuoteMaterialSummary({
            scopes: [scope],
            elementGroupsByScope: { 1: { 'pilar+5': group } },
            quote,
        })

        // icChapa1 overridden to 5 at quote level; quantity = 10/5 = 2
        expect(entry.quantity).toBe(2)
        expect(entry.totalValue).toBe(10000)
    })

    test('multiple scopes produce separate entries (not merged)', () => {
        const scopeA = makeScope({
            id: 1,
            name: 'Escopo A',
            materials: {
                '7': {
                    id: 7,
                    supplierId: 1,
                    sku: 'CH-001',
                    name: 'Chapa A',
                    type: 'chapa',
                    value: 5000,
                },
            },
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'pilar+5',
                    materialType: 'chapa',
                    materialId: 7,
                    overrides: {},
                },
            ],
        })
        const scopeB = makeScope({
            id: 2,
            name: 'Escopo B',
            materials: {
                '8': {
                    id: 8,
                    supplierId: 1,
                    sku: 'CH-002',
                    name: 'Chapa B',
                    type: 'chapa',
                    value: 6000,
                },
            },
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'pilar+5',
                    materialType: 'chapa',
                    materialId: 8,
                    overrides: {},
                },
            ],
        })
        const group = makeGroup({ category: 'pilar+5', totalM2: 10 })

        const result = calculateQuoteMaterialSummary({
            scopes: [scopeA, scopeB],
            elementGroupsByScope: {
                1: { 'pilar+5': group },
                2: { 'pilar+5': group },
            },
        })

        expect(result).toHaveLength(2)
        expect(result[0].scopeName).toBe('Escopo A')
        expect(result[1].scopeName).toBe('Escopo B')
    })

    test('totalM2 zero when group has no totalM2', () => {
        const snapshot = {
            id: 7,
            supplierId: 1,
            sku: 'CH-001',
            name: 'Chapa',
            type: 'chapa' as const,
            value: 5000,
        }
        const scope = makeScope({
            id: 1,
            name: 'Escopo A',
            materials: { '7': snapshot },
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'pilar+5',
                    materialType: 'chapa',
                    materialId: 7,
                    overrides: {},
                },
            ],
        })
        const group = makeGroup({ category: 'pilar+5', totalM2: undefined })

        const [entry] = calculateQuoteMaterialSummary({
            scopes: [scope],
            elementGroupsByScope: { 1: { 'pilar+5': group } },
        })

        expect(entry.totalM2).toBe(0)
        expect(entry.quantity).toBe(0) // 0 / 2.5 = 0 (not null since IC is valid)
        expect(entry.totalValue).toBe(0)
    })
})
