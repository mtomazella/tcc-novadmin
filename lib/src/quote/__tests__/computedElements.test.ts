import { describe, expect, test } from 'vitest'
import type {
    IncludeDatabaseDates,
    Product,
    QuoteElement,
    QuoteElementLajeValues,
    QuoteElementPilarValues,
    QuoteElementVigaValues,
    QuoteScope,
} from 'types/index.js'
import {
    generateComputedElements,
    computeGarfoPieceCounts,
} from '../computedElements.js'

const makeScope = (
    overrides: Partial<QuoteScope> & { id: number; quoteId: number }
): QuoteScope =>
    ({
        name: 'Scope',
        overriddenFixedCosts: [],
        overriddenProductConsumption: [],
        materials: {},
        materialSelections: {},
        ...overrides,
    }) as QuoteScope

const makeViga = (
    scopeId: number,
    quoteId: number,
    quantidade: number,
    fundoDeVigaM2: number,
    overrides?: Partial<QuoteElementVigaValues>
): QuoteElement =>
    ({
        quoteId,
        scopeId,
        productId: 5,
        type: 'viga',
        name: 'Viga',
        category: 'viga+5',
        values: {
            fundoCm: 10,
            lateralCm: 20,
            comprimentoCm: 300,
            alturaLajeLateralACm: 15,
            alturaLajeLateralBCm: 15,
            quantidade,
            tipo: 'interno',
            cambotado: false,
            needsGarfo: false,
            ripado: false,
            aparente: false,
            paginado: false,
            fundoDeVigaM2,
            lateralDeVigaM2: 0,
            ...overrides,
        } as QuoteElementVigaValues,
    }) as QuoteElement

const makeLaje = (
    scopeId: number,
    quoteId: number,
    quantidade: number,
    faixasAdicionaisM2: number
): QuoteElement =>
    ({
        quoteId,
        scopeId,
        productId: 7,
        type: 'laje',
        name: 'Laje',
        category: 'laje+7',
        values: {
            areaM2: 100,
            perimetroM: 40,
            fechamentoM2: 0,
            quantidade,
            ripado: false,
            aparente: false,
            paginado: false,
            faixasAdicionaisM2,
            metragemM2: 100 * quantidade,
        } as QuoteElementLajeValues,
    }) as QuoteElement

const makePilar = (
    scopeId: number,
    quoteId: number,
    quantidade: number,
    overrides?: Partial<QuoteElementPilarValues>
): QuoteElement =>
    ({
        quoteId,
        scopeId,
        productId: 3,
        type: 'pilar',
        name: 'Pilar',
        category: 'pilar+3',
        values: {
            fundoCm: 40,
            lateralCm: 60,
            peDireitoM: 3,
            quantidade,
            cambotado: false,
            needsGastalho: false,
            ripado: false,
            aparente: false,
            paginado: false,
            metragemM2: 0,
            ...overrides,
        } as QuoteElementPilarValues,
    }) as QuoteElement

describe('generateComputedElements', () => {
    test('generates fundo adicional element from viga elements', () => {
        const scope = makeScope({ id: 1, quoteId: 99, fundoAdicionalCount: 2 })
        const vigas = [makeViga(1, 99, 1, 3), makeViga(1, 99, 1, 5)]

        const result = generateComputedElements(vigas, [scope])

        expect(result).toHaveLength(1)
        const fundo = result[0]
        expect(fundo.type).toBe('outro')
        expect(fundo.productId).toBe(10)
        expect(fundo.category).toBe('outro+10')
        expect(fundo.scopeId).toBe(1)
        expect(fundo.quoteId).toBe(99)
        expect(fundo.values.quantidade).toBe(4) // (1+1) * 2
        expect((fundo.values as any).metragemM2).toBe(16) // (3+5) * 2
    })

    test('generates faixas adicionais element from laje elements', () => {
        const scope = makeScope({ id: 1, quoteId: 99, tiraAdicionalCount: 3 })
        const lajeElements = [makeLaje(1, 99, 2, 4)]

        const result = generateComputedElements(lajeElements, [scope])

        expect(result).toHaveLength(1)
        const faixas = result[0]
        expect(faixas.type).toBe('outro')
        expect(faixas.productId).toBe(18)
        expect(faixas.category).toBe('outro+18')
        expect(faixas.values.quantidade).toBe(6) // 2 * 3
        expect((faixas.values as any).metragemM2).toBe(12) // 4 * 3
    })

    test('does not generate fundo adicional when count is 0', () => {
        const scope = makeScope({ id: 1, quoteId: 99, fundoAdicionalCount: 0 })
        const vigas = [makeViga(1, 99, 1, 5)]

        const result = generateComputedElements(vigas, [scope])

        expect(result).toHaveLength(0)
    })

    test('does not generate fundo adicional when count is undefined', () => {
        const scope = makeScope({ id: 1, quoteId: 99 })
        const vigas = [makeViga(1, 99, 1, 5)]

        const result = generateComputedElements(vigas, [scope])

        expect(result).toHaveLength(0)
    })

    test('does not generate fundo adicional when no viga elements exist', () => {
        const scope = makeScope({ id: 1, quoteId: 99, fundoAdicionalCount: 2 })

        const result = generateComputedElements([], [scope])

        expect(result).toHaveLength(0)
    })

    test('does not generate faixas adicionais when no laje elements exist', () => {
        const scope = makeScope({ id: 1, quoteId: 99, tiraAdicionalCount: 2 })

        const result = generateComputedElements([], [scope])

        expect(result).toHaveLength(0)
    })

    test('generates per-scope elements with correct scopeId for multiple scopes', () => {
        const scope1 = makeScope({
            id: 1,
            quoteId: 99,
            fundoAdicionalCount: 1,
        })
        const scope2 = makeScope({
            id: 2,
            quoteId: 99,
            fundoAdicionalCount: 2,
        })
        const elements = [makeViga(1, 99, 1, 3), makeViga(2, 99, 1, 5)]

        const result = generateComputedElements(elements, [scope1, scope2])

        expect(result).toHaveLength(2)
        const forScope1 = result.find((e) => e.scopeId === 1)!
        const forScope2 = result.find((e) => e.scopeId === 2)!
        expect((forScope1.values as any).metragemM2).toBe(3) // 3 * 1
        expect((forScope2.values as any).metragemM2).toBe(10) // 5 * 2
    })

    test('generates both fundo and faixas for the same scope when both counts are set', () => {
        const scope = makeScope({
            id: 1,
            quoteId: 99,
            fundoAdicionalCount: 1,
            tiraAdicionalCount: 1,
        })
        const elements = [makeViga(1, 99, 1, 4), makeLaje(1, 99, 1, 6)]

        const result = generateComputedElements(elements, [scope])

        expect(result).toHaveLength(2)
        expect(result.map((e) => e.productId).sort()).toEqual([10, 18])
    })

    test('attaches product from productLookup when provided', () => {
        const scope = makeScope({ id: 1, quoteId: 99, fundoAdicionalCount: 1 })
        const vigas = [makeViga(1, 99, 1, 3)]
        const mockProduct = {
            id: 10,
            name: 'FdV Adicional',
            commercialPercentage: null,
            projectPercentage: null,
            consumptionRates: {},
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
            createdAt: new Date(),
            updatedAt: new Date(),
        } as unknown as IncludeDatabaseDates<Product>
        const productLookup = new Map([[10, mockProduct]])

        const result = generateComputedElements(vigas, [scope], productLookup)

        expect(result).toHaveLength(1)
        expect(result[0].product).toBe(mockProduct)
    })

    test('sets product to null when productLookup is not provided', () => {
        const scope = makeScope({ id: 1, quoteId: 99, fundoAdicionalCount: 1 })
        const vigas = [makeViga(1, 99, 1, 3)]

        const result = generateComputedElements(vigas, [scope])

        expect(result[0].product).toBeNull()
    })

    test('generates garfo element from viga with needsGarfo modifier', () => {
        const scope = makeScope({ id: 1, quoteId: 99 })
        const vigas = [
            makeViga(1, 99, 1, 0, { needsGarfo: true, comprimentoCm: 500 }),
            makeViga(1, 99, 1, 0, { needsGarfo: false, comprimentoCm: 300 }),
        ]

        const result = generateComputedElements(vigas, [scope])

        expect(result).toHaveLength(1)
        const garfo = result[0]
        expect(garfo.productId).toBe(32)
        expect(garfo.values.quantidade).toBe(10) // (500 / 100) * 2
        expect((garfo.values as any).metragemM2).toBe(0)
    })

    test('generates garfo element from borda vigas when garfoBordaEnabled', () => {
        const scope = makeScope({ id: 1, quoteId: 99, garfoBordaEnabled: true })
        const vigas = [
            makeViga(1, 99, 1, 0, { tipo: 'borda', comprimentoCm: 200 }),
            makeViga(1, 99, 1, 0, { tipo: 'interno', comprimentoCm: 400 }),
        ]

        const result = generateComputedElements(vigas, [scope])

        expect(result).toHaveLength(1)
        const garfo = result[0]
        expect(garfo.productId).toBe(32)
        expect(garfo.values.quantidade).toBe(4) // (200 / 100) * 2
    })

    test('generates garfo element from interno vigas when garfoInternoEnabled', () => {
        const scope = makeScope({
            id: 1,
            quoteId: 99,
            garfoInternoEnabled: true,
        })
        const vigas = [
            makeViga(1, 99, 1, 0, { tipo: 'borda', comprimentoCm: 200 }),
            makeViga(1, 99, 1, 0, { tipo: 'interno', comprimentoCm: 400 }),
        ]

        const result = generateComputedElements(vigas, [scope])

        expect(result).toHaveLength(1)
        const garfo = result[0]
        expect(garfo.productId).toBe(32)
        expect(garfo.values.quantidade).toBe(8) // (400 / 100) * 2
    })

    test('sums comprimentoCm from all applicable garfo vigas', () => {
        const scope = makeScope({
            id: 1,
            quoteId: 99,
            garfoBordaEnabled: true,
            garfoInternoEnabled: true,
        })
        const vigas = [
            makeViga(1, 99, 1, 0, { tipo: 'borda', comprimentoCm: 300 }),
            makeViga(1, 99, 1, 0, { tipo: 'interno', comprimentoCm: 200 }),
        ]

        const result = generateComputedElements(vigas, [scope])

        expect(result).toHaveLength(1)
        expect(result[0].values.quantidade).toBe(10) // ((300 + 200) / 100) * 2
    })

    test('does not generate garfo when no applicable vigas', () => {
        const scope = makeScope({ id: 1, quoteId: 99 })
        const vigas = [
            makeViga(1, 99, 1, 0, { needsGarfo: false, tipo: 'interno' }),
        ]

        const result = generateComputedElements(vigas, [scope])

        expect(result).toHaveLength(0)
    })

    test('generates gastalho element from pilar with needsGastalho modifier', () => {
        const scope = makeScope({ id: 1, quoteId: 99, gastalhoCount: 1 })
        const pilares = [
            makePilar(1, 99, 1, {
                needsGastalho: true,
                fundoCm: 40,
                lateralCm: 60,
            }),
            makePilar(1, 99, 1, { needsGastalho: false }),
        ]

        const result = generateComputedElements(pilares, [scope])

        expect(result).toHaveLength(1)
        const gastalho = result[0]
        expect(gastalho.productId).toBe(36)
        // (((40 + 60) / 100) + 1.2 * 1) / 3 * 1 = round(0.733) = 1
        expect(gastalho.values.quantidade).toBe(1)
        expect((gastalho.values as any).metragemM2).toBe(0)
    })

    test('does not generate gastalho when gastalhoCount is 0', () => {
        const scope = makeScope({ id: 1, quoteId: 99, gastalhoCount: 0 })
        const pilares = [makePilar(1, 99, 1, { needsGastalho: true })]

        const result = generateComputedElements(pilares, [scope])

        expect(result).toHaveLength(0)
    })
})

describe('computeGarfoPieceCounts', () => {
    test('returns zeros when there are no viga elements', () => {
        const scope = makeScope({ id: 1, quoteId: 99 })
        const result = computeGarfoPieceCounts([], [scope])
        expect(result).toEqual({ bordaCount: 0, internoCount: 0 })
    })

    test('splits needsGarfo vigas by tipo (borda vs interno)', () => {
        const scope = makeScope({ id: 1, quoteId: 99 })
        const vigas = [
            makeViga(1, 99, 1, 0, {
                needsGarfo: true,
                tipo: 'borda',
                comprimentoCm: 300,
            }),
            makeViga(1, 99, 1, 0, {
                needsGarfo: true,
                tipo: 'interno',
                comprimentoCm: 200,
            }),
            makeViga(1, 99, 1, 0, {
                needsGarfo: false,
                tipo: 'borda',
                comprimentoCm: 100,
            }),
        ]
        const result = computeGarfoPieceCounts(vigas, [scope])
        // borda: round((300/100)*2) = 6; interno: round((200/100)*2) = 4
        expect(result).toEqual({ bordaCount: 6, internoCount: 4 })
    })

    test('garfoBordaEnabled on scope expands borda set without affecting interno', () => {
        const scope = makeScope({ id: 1, quoteId: 99, garfoBordaEnabled: true })
        const vigas = [
            makeViga(1, 99, 1, 0, { tipo: 'borda', comprimentoCm: 200 }),
            makeViga(1, 99, 1, 0, { tipo: 'interno', comprimentoCm: 400 }),
        ]
        const result = computeGarfoPieceCounts(vigas, [scope])
        // borda: round((200/100)*2) = 4; interno not enabled, 0
        expect(result).toEqual({ bordaCount: 4, internoCount: 0 })
    })

    test('garfoInternoEnabled on scope expands interno set without affecting borda', () => {
        const scope = makeScope({
            id: 1,
            quoteId: 99,
            garfoInternoEnabled: true,
        })
        const vigas = [
            makeViga(1, 99, 1, 0, { tipo: 'borda', comprimentoCm: 200 }),
            makeViga(1, 99, 1, 0, { tipo: 'interno', comprimentoCm: 400 }),
        ]
        const result = computeGarfoPieceCounts(vigas, [scope])
        // interno: round((400/100)*2) = 8; borda not enabled, 0
        expect(result).toEqual({ bordaCount: 0, internoCount: 8 })
    })

    test('sums piece counts across multiple scopes', () => {
        const scope1 = makeScope({
            id: 1,
            quoteId: 99,
            garfoBordaEnabled: true,
        })
        const scope2 = makeScope({
            id: 2,
            quoteId: 99,
            garfoInternoEnabled: true,
        })
        const vigas = [
            makeViga(1, 99, 1, 0, { tipo: 'borda', comprimentoCm: 100 }),
            makeViga(2, 99, 1, 0, { tipo: 'interno', comprimentoCm: 300 }),
        ]
        const result = computeGarfoPieceCounts(vigas, [scope1, scope2])
        // scope1 borda: round((100/100)*2) = 2; scope2 interno: round((300/100)*2) = 6
        expect(result).toEqual({ bordaCount: 2, internoCount: 6 })
    })

    test('aggregate-then-round can differ from the old per-viga rounding for same-tipo multiples', () => {
        // Two borda vigas of 75cm each: generateComputedElements sums their
        // comprimentoCm first (150cm) and rounds once, rather than rounding
        // each viga's contribution independently before summing.
        const scope = makeScope({ id: 1, quoteId: 99 })
        const vigas = [
            makeViga(1, 99, 1, 0, {
                needsGarfo: true,
                tipo: 'borda',
                comprimentoCm: 75,
            }),
            makeViga(1, 99, 1, 0, {
                needsGarfo: true,
                tipo: 'borda',
                comprimentoCm: 75,
            }),
        ]
        const result = computeGarfoPieceCounts(vigas, [scope])
        // round((150/100)*2) = 3, not round(1.5)+round(1.5) = 4
        expect(result).toEqual({ bordaCount: 3, internoCount: 0 })
    })
})
