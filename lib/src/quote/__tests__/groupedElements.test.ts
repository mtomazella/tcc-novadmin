import { describe, expect, test } from 'vitest'
import type {
    IncludeDatabaseDates,
    Product,
    QuoteElement,
    QuoteElementType,
} from 'types/index.js'
import {
    buildCategory,
    calculateGroupPercentageTotals,
    elementsToGroupedElements,
    enrichGroupedElementsWithName,
    splitCategory,
} from '../groupedElements.js'

// ─── Fixtures ────────────────────────────────────────────────────────────

const mockProduct: IncludeDatabaseDates<Product> = {
    id: 10,
    name: 'Chapa Padrão',
    typeOnQuote: 'pilar',
    modifiers: {
        cambotado: true,
        ripado: true,
        aparente: true,
        paginado: true,
        needsGarfo: false,
        needsGastalho: true,
        garfo: false,
        gastalho: false,
        fundoDeViga: false,
    },
    commercialPercentage: null,
    projectPercentage: null,
    consumptionRates: {
        icChapa1: 1.5,
        icRipa1: 2.0,
        icChapa2: 1.2,
        icRipa2: 0.8,
        icChapa3: 0.5,
        icRipa3: 0.3,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
}

const mockProducts: IncludeDatabaseDates<Product>[] = [
    mockProduct,
    {
        id: 20,
        name: 'Viga Reforçada',
        typeOnQuote: 'viga',
        modifiers: {
            cambotado: true,
            ripado: true,
            aparente: false,
            paginado: true,
            needsGarfo: false,
            needsGastalho: false,
            garfo: false,
            gastalho: false,
            fundoDeViga: false,
        },
        commercialPercentage: null,
        projectPercentage: null,
        consumptionRates: {
            icChapa1: 2.0,
            icRipa1: 1.5,
            icChapa2: 1.0,
            icRipa2: 0.5,
            icChapa3: 0.2,
            icRipa3: 0.1,
        },
    },
] as unknown as IncludeDatabaseDates<Product>[]

const createMockElement = (
    overrides?: Partial<QuoteElement>
): QuoteElement => ({
    id: 1,
    quoteId: 100,
    scopeId: null,
    productId: 10,
    type: 'pilar' as const,
    name: 'Pilar Standard',
    values: {
        fundoCm: 30,
        lateralCm: 30,
        peDireitoM: 3,
        quantidade: 5,
        cambotado: false,
        needsGastalho: false,
        ripado: false,
        aparente: false,
        paginado: false,
        metragemM2: 45,
    },
    product: mockProduct,
    category: 'pilar+10',
    ...overrides,
})

// ─── buildCategory tests ─────────────────────────────────────────────────

describe('buildCategory', () => {
    test('builds category with type and productId only', () => {
        const category = buildCategory({
            type: 'pilar',
            productId: 10,
            modifiers: {},
        })
        expect(category).toBe('pilar+10')
    })

    test('builds category with single modifier', () => {
        const category = buildCategory({
            type: 'viga',
            productId: 20,
            modifiers: {
                cambotado: true,
                gastalho: false,
                ripado: false,
                aparente: false,
                paginado: false,
                garfo: false,
            },
        })
        expect(category).toBe('viga+20+cambotado')
    })

    test('builds category with multiple modifiers', () => {
        const category = buildCategory({
            type: 'pilar',
            productId: 10,
            modifiers: {
                cambotado: true,
                gastalho: true,
                ripado: false,
                aparente: false,
                paginado: false,
                garfo: false,
            },
        })
        expect(category).toMatch('pilar+10+cambotado+gastalho')
    })

    test('ignores false modifier values', () => {
        const category = buildCategory({
            type: 'laje',
            productId: 30,
            modifiers: {
                cambotado: false,
                gastalho: false,
                ripado: false,
                aparente: false,
                paginado: false,
                garfo: false,
            },
        })
        expect(category).toBe('laje+30')
    })

    test('handles all modifier types', () => {
        const category = buildCategory({
            type: 'pilar',
            productId: 10,
            modifiers: {
                cambotado: true,
                gastalho: true,
                ripado: true,
                aparente: true,
                paginado: true,
                garfo: true,
            },
        })
        expect(category).toBe(
            'pilar+10+aparente+cambotado+garfo+gastalho+paginado+ripado'
        )
    })

    test('expect order of modifiers to be consistent', () => {
        const category = buildCategory({
            type: 'pilar',
            productId: 10,
            modifiers: {
                paginado: true,
                cambotado: true,
                garfo: true,
                gastalho: true,
                aparente: true,
                ripado: true,
            },
        })
        expect(category).toBe(
            'pilar+10+aparente+cambotado+garfo+gastalho+paginado+ripado'
        )
    })
})

// ─── splitCategory tests ─────────────────────────────────────────────────

describe('splitCategory', () => {
    test('splits category with type and productId only', () => {
        const result = splitCategory('pilar+10')
        expect(result).toEqual({
            type: 'pilar',
            productId: 10,
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
        })
    })

    test('splits category with single modifier', () => {
        const result = splitCategory('viga+20+cambotado')
        expect(result).toEqual({
            type: 'viga',
            productId: 20,
            modifiers: {
                cambotado: true,
                ripado: false,
                aparente: false,
                paginado: false,
                needsGarfo: false,
                needsGastalho: false,
                garfo: false,
                gastalho: false,
                fundoDeViga: false,
            },
        })
    })

    test('splits category with multiple modifiers', () => {
        const result = splitCategory('pilar+10+cambotado+gastalho+ripado')
        expect(result).toEqual({
            type: 'pilar',
            productId: 10,
            modifiers: {
                cambotado: true,
                ripado: true,
                aparente: false,
                paginado: false,
                needsGarfo: false,
                needsGastalho: false,
                garfo: false,
                gastalho: true,
                fundoDeViga: false,
            },
        })
    })

    test('handles all modifier types', () => {
        const result = splitCategory(
            'laje+30+cambotado+gastalho+ripado+aparente+paginado+garfo+needsGarfo+needsGastalho+fundoDeViga'
        )
        expect(result).toEqual({
            type: 'laje',
            productId: 30,
            modifiers: {
                cambotado: true,
                ripado: true,
                aparente: true,
                paginado: true,
                needsGarfo: true,
                needsGastalho: true,
                garfo: true,
                gastalho: true,
                fundoDeViga: true,
            },
        })
    })

    test('is inverse of buildCategory', () => {
        const original = {
            type: 'viga' as QuoteElementType,
            productId: 25,
            modifiers: {
                cambotado: true,
                gastalho: false,
                ripado: true,
                aparente: false,
                paginado: false,
                garfo: false,
            },
        }
        const category = buildCategory(original)
        const restored = splitCategory(category)
        expect(restored.type).toBe(original.type)
        expect(restored.productId).toBe(original.productId)
        // Check that only true modifiers are in restored
        Object.entries(original.modifiers).forEach(([key, value]) => {
            if (value) {
                expect(
                    restored.modifiers[key as keyof typeof restored.modifiers]
                ).toBe(true)
            }
        })
    })

    test('return all modifiers, even if they are false', () => {
        const result = splitCategory('pilar+10')
        expect(result).toEqual({
            type: 'pilar',
            productId: 10,
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
        })
    })
})

// ─── elementsToGroupedElements tests ─────────────────────────────────────

describe('elementsToGroupedElements', () => {
    test('groups single element by category', () => {
        const element = createMockElement()
        const grouped = elementsToGroupedElements([element])

        expect(grouped).toHaveProperty('pilar+10')
        expect(grouped['pilar+10']).toEqual({
            category: 'pilar+10',
            categoryName: 'Chapa Padrão',
            elements: [element],
            quantity: 5,
            totalM2: 45,
        })
    })

    test('groups multiple elements with same category', () => {
        const element1 = createMockElement({
            id: 1,
            values: { ...createMockElement().values, quantidade: 3 },
        })
        const element2 = createMockElement({
            id: 2,
            values: { ...createMockElement().values, quantidade: 2 },
        })
        const grouped = elementsToGroupedElements([element1, element2])

        expect(grouped['pilar+10'].elements).toHaveLength(2)
        expect(grouped['pilar+10'].quantity).toBe(5) // 3 + 2
        expect(grouped['pilar+10'].totalM2).toBe(90) // 45 + 45
    })

    test('groups elements with different categories separately', () => {
        const element1 = createMockElement({ category: 'pilar+10' })
        const element2 = createMockElement({
            id: 2,
            category: 'pilar+10+cambotado',
            values: { ...createMockElement().values, quantidade: 2 },
        })
        const grouped = elementsToGroupedElements([element1, element2])

        expect(Object.keys(grouped)).toHaveLength(2)
        expect(grouped['pilar+10'].quantity).toBe(5)
        expect(grouped['pilar+10+cambotado'].quantity).toBe(2)
    })

    test('handles empty elements array', () => {
        const grouped = elementsToGroupedElements([])
        expect(grouped).toEqual({})
    })

    test('calculates totalM2 correctly for pilar elements', () => {
        const element1 = createMockElement({
            id: 1,
            type: 'pilar',
            values: { ...createMockElement().values, metragemM2: 30 },
        })
        const element2 = createMockElement({
            id: 2,
            type: 'pilar',
            values: { ...createMockElement().values, metragemM2: 15 },
        })
        const grouped = elementsToGroupedElements([element1, element2])

        expect(grouped['pilar+10'].totalM2).toBe(45) // 30 + 15
    })

    test('calculates totalM2 for viga elements with fundo', () => {
        const vigaElement = createMockElement({
            id: 1,
            type: 'viga',
            values: {
                fundoCm: 30,
                lateralCm: 20,
                comprimentoCm: 400,
                alturaLajeLateralACm: 50,
                alturaLajeLateralBCm: 50,
                quantidade: 1,
                tipo: 'interno',
                cambotado: false,
                needsGarfo: false,
                ripado: false,
                aparente: false,
                paginado: false,
                fundoDeVigaM2: 12,
                lateralDeVigaM2: 8,
            },
        })
        const grouped = elementsToGroupedElements([vigaElement])

        expect(grouped['pilar+10'].totalM2).toBe(20) // fundoDeVigaM2 (12) + lateralDeVigaM2 (8)
    })

    test('handles elements without category gracefully', () => {
        const element = createMockElement({ category: undefined })
        const grouped = elementsToGroupedElements([element])

        // Elements without explicit category still get grouped by their undefined
        expect(grouped).toHaveProperty('undefined')
    })

    test('accumulates quantities across multiple elements', () => {
        const elements = [
            createMockElement({
                id: 1,
                values: { ...createMockElement().values, quantidade: 10 },
            }),
            createMockElement({
                id: 2,
                values: { ...createMockElement().values, quantidade: 20 },
            }),
            createMockElement({
                id: 3,
                values: { ...createMockElement().values, quantidade: 15 },
            }),
        ]
        const grouped = elementsToGroupedElements(elements)

        expect(grouped['pilar+10'].quantity).toBe(45) // 10 + 20 + 15
        expect(grouped['pilar+10'].elements).toHaveLength(3)
    })

    test('builds categoryName from product name and modifiers', () => {
        const element = createMockElement({
            product: mockProduct,
            values: {
                ...createMockElement().values,
                cambotado: true,
                needsGastalho: true,
            },
        })
        const grouped = elementsToGroupedElements([element])

        expect(grouped['pilar+10'].categoryName).toContain('Chapa Padrão')
    })
})

// ─── enrichGroupedElementsWithName tests ──────────────────────────────────

describe('enrichGroupedElementsWithName', () => {
    test('enriches with product name when product found', () => {
        const element = createMockElement({ product: mockProduct })
        const grouped = elementsToGroupedElements([element])

        const enriched = enrichGroupedElementsWithName({
            groupedElements: grouped,
            products: mockProducts,
        })

        expect(enriched['pilar+10'].categoryName).toContain('Chapa Padrão')
    })

    test('enriches with category key as fallback when product not found', () => {
        const element = createMockElement({
            productId: 999,
            product: undefined,
        })
        const grouped = elementsToGroupedElements([element])

        const enriched = enrichGroupedElementsWithName({
            groupedElements: grouped,
            products: mockProducts,
        })

        expect(enriched['pilar+10'].categoryName).toBe('pilar+10')
    })

    test('preserves other grouped element properties', () => {
        const elements = [
            createMockElement({
                id: 1,
                values: { ...createMockElement().values, quantidade: 5 },
            }),
            createMockElement({
                id: 2,
                values: { ...createMockElement().values, quantidade: 3 },
            }),
        ]
        const grouped = elementsToGroupedElements(elements)

        const enriched = enrichGroupedElementsWithName({
            groupedElements: grouped,
            products: mockProducts,
        })

        expect(enriched['pilar+10'].elements).toHaveLength(2)
        expect(enriched['pilar+10'].quantity).toBe(8)
        expect(enriched['pilar+10'].category).toBe('pilar+10')
    })

    test('enriches multiple categories', () => {
        const element1 = createMockElement({
            id: 1,
            category: 'pilar+10',
            product: mockProducts[0],
        })
        const element2 = createMockElement({
            id: 2,
            productId: 20,
            category: 'viga+20',
            type: 'viga',
            product: mockProducts[1],
        })
        const grouped = elementsToGroupedElements([element1, element2])

        const enriched = enrichGroupedElementsWithName({
            groupedElements: grouped,
            products: mockProducts,
        })

        expect(enriched['pilar+10'].categoryName).toContain('Chapa Padrão')
        expect(enriched['viga+20'].categoryName).toContain('Viga Reforçada')
    })

    test('handles empty grouped elements', () => {
        const enriched = enrichGroupedElementsWithName({
            groupedElements: {},
            products: mockProducts,
        })

        expect(enriched).toEqual({})
    })

    test('returns all fields from original grouped element', () => {
        const elements = [
            createMockElement({
                id: 1,
                values: {
                    ...createMockElement().values,
                    quantidade: 4,
                    metragemM2: 36,
                },
            }),
        ]
        const grouped = elementsToGroupedElements(elements)
        const enriched = enrichGroupedElementsWithName({
            groupedElements: grouped,
            products: mockProducts,
        })

        const result = enriched['pilar+10']
        expect(result).toHaveProperty('category')
        expect(result).toHaveProperty('categoryName')
        expect(result).toHaveProperty('elements')
        expect(result).toHaveProperty('quantity', 4)
        expect(result).toHaveProperty('totalM2', 36)
    })
})

// ─── Integration tests ───────────────────────────────────────────────────

describe('groupedElements integration', () => {
    test('complete workflow: build, split, group, enrich', () => {
        // Build a category
        const categoryParts = {
            type: 'pilar' as QuoteElementType,
            productId: 10,
            modifiers: {
                cambotado: true,
                gastalho: true,
                ripado: false,
                aparente: false,
                paginado: false,
                garfo: false,
            },
        }
        const category = buildCategory(categoryParts)

        // Split it back
        const restored = splitCategory(category)
        expect(restored.type).toBe(categoryParts.type)
        expect(restored.productId).toBe(categoryParts.productId)

        // Create element with this category and group
        const element = createMockElement({ category })
        const grouped = elementsToGroupedElements([element])
        expect(grouped).toHaveProperty(category)

        // Enrich with product names
        const enriched = enrichGroupedElementsWithName({
            groupedElements: grouped,
            products: mockProducts,
        })
        expect(enriched[category].categoryName).toBeDefined()
    })

    test('handles complex scenario with multiple element types', () => {
        const pilarElement = createMockElement({
            id: 1,
            type: 'pilar',
            category: 'pilar+10+cambotado',
            values: { ...createMockElement().values, quantidade: 5 },
        })
        const vigaElement = createMockElement({
            id: 2,
            type: 'viga',
            productId: 20,
            category: 'viga+20+ripado',
            values: {
                fundoCm: 40,
                lateralCm: 25,
                comprimentoCm: 500,
                alturaLajeLateralACm: 50,
                alturaLajeLateralBCm: 50,
                quantidade: 3,
                tipo: 'borda',
                cambotado: false,
                needsGarfo: false,
                ripado: true,
                aparente: false,
                paginado: false,
                fundoDeVigaM2: 20,
                lateralDeVigaM2: 12,
            },
            product: mockProducts[1],
        })

        const grouped = elementsToGroupedElements([pilarElement, vigaElement])
        expect(Object.keys(grouped)).toHaveLength(2)

        const enriched = enrichGroupedElementsWithName({
            groupedElements: grouped,
            products: mockProducts,
        })

        expect(enriched['pilar+10+cambotado'].quantity).toBe(5)
        expect(enriched['viga+20+ripado'].quantity).toBe(3)
    })
})

// ─── calculateGroupPercentageTotals ──────────────────────────────────────

describe('calculateGroupPercentageTotals', () => {
    const makeGroup = (totalM2: number) => ({
        category: 'pilar+10',
        categoryName: 'Chapa Padrão',
        quantity: 2,
        totalM2,
        elements: [],
    })

    test('projectPercentage null → projectTotalM2 is undefined (falls back to base m²)', () => {
        const result = calculateGroupPercentageTotals({
            groupedElements: { 'pilar+10': makeGroup(20) },
            productConsumption: [
                {
                    category: 'pilar+10',
                    commercialPercentage: null,
                    projectPercentage: null,
                },
            ],
        })
        expect(result['pilar+10'].projectTotalM2).toBeUndefined()
    })

    test('projectPercentage 0.8 → projectTotalM2 = totalM2 * 0.8', () => {
        const result = calculateGroupPercentageTotals({
            groupedElements: { 'pilar+10': makeGroup(20) },
            productConsumption: [
                {
                    category: 'pilar+10',
                    commercialPercentage: null,
                    projectPercentage: 0.8,
                },
            ],
        })
        expect(result['pilar+10'].projectTotalM2).toBe(16) // 20 * 0.8
    })

    test('commercialPercentage null → commercialTotalM2 = totalM2 (formula: totalM2 * (0 + 1))', () => {
        const result = calculateGroupPercentageTotals({
            groupedElements: { 'pilar+10': makeGroup(20) },
            productConsumption: [
                {
                    category: 'pilar+10',
                    commercialPercentage: null,
                    projectPercentage: null,
                },
            ],
        })
        expect(result['pilar+10'].commercialTotalM2).toBe(20) // 20 * 1
    })

    test('commercialPercentage 0.1 → commercialTotalM2 = totalM2 * 1.1', () => {
        const result = calculateGroupPercentageTotals({
            groupedElements: { 'pilar+10': makeGroup(20) },
            productConsumption: [
                {
                    category: 'pilar+10',
                    commercialPercentage: 0.1,
                    projectPercentage: null,
                },
            ],
        })
        expect(result['pilar+10'].commercialTotalM2).toBeCloseTo(22) // 20 * 1.1
    })

    test('entry missing for category → projectTotalM2 undefined, commercialTotalM2 = totalM2', () => {
        const result = calculateGroupPercentageTotals({
            groupedElements: { 'pilar+10': makeGroup(15) },
            productConsumption: [],
        })
        expect(result['pilar+10'].projectTotalM2).toBeUndefined()
        expect(result['pilar+10'].commercialTotalM2).toBe(15) // 15 * (0 + 1)
    })
})
