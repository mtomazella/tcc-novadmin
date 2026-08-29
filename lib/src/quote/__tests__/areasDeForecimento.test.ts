import { describe, it, expect } from 'vitest'
import {
    computeAreasDeForecimentoTable,
    deriveEspFromScope,
} from '../areasDeForecimento.js'
import type {
    QuoteElement,
    QuoteScope,
    QuoteElementPilarValues,
    QuoteElementLajeValues,
} from '../../types/index.js'

const BASE_SCOPE: QuoteScope = {
    quoteId: 1,
    name: 'Pavimento Tipo',
    overriddenFixedCosts: [],
    overriddenProductConsumption: [],
    materials: {},
    materialSelections: [],
}

function makePilar(metragemM2: number): QuoteElement {
    return {
        id: 1,
        quoteId: 1,
        scopeId: 1,
        productId: 1,
        type: 'pilar',
        name: 'Pilar',
        values: {
            fundoCm: 50,
            lateralCm: 30,
            peDireitoM: 3,
            quantidade: 1,
            cambotado: false,
            needsGastalho: false,
            ripado: false,
            aparente: false,
            paginado: false,
            metragemM2,
        } as QuoteElementPilarValues,
    }
}

function makeLaje(metragemM2: number): QuoteElement {
    return {
        id: 2,
        quoteId: 1,
        scopeId: 1,
        productId: 2,
        type: 'laje',
        name: 'Laje',
        values: {
            areaM2: metragemM2,
            perimetroM: 10,
            fechamentoM2: 0,
            quantidade: 1,
            ripado: false,
            aparente: false,
            paginado: false,
            metragemM2,
        } as QuoteElementLajeValues,
    }
}

function makeFundoAdicional(metragemM2: number): QuoteElement {
    return {
        quoteId: 1,
        scopeId: 1,
        productId: 10,
        type: 'outro',
        name: 'Fundo adicional de viga',
        values: { quantidade: 1, metragemM2 },
    }
}

describe('computeAreasDeForecimentoTable', () => {
    it('returns all rows with null m2 when elements is empty', () => {
        const result = computeAreasDeForecimentoTable([])
        expect(result.rows).toHaveLength(5)
        expect(result.rows.every((row) => row.m2 === null)).toBe(true)
        expect(result.totalM2).toBe(0)
    })

    it('sums m2 for pilar and laje, leaves others null', () => {
        const pilar = makePilar(10)
        const laje = makeLaje(20)
        const result = computeAreasDeForecimentoTable([pilar, laje])
        const pilarRow = result.rows.find((r) => r.label === 'Pilar')!
        const lajeRow = result.rows.find((r) => r.label === 'Laje')!
        const vigaRow = result.rows.find((r) => r.label === 'Viga')!
        expect(pilarRow.m2).toBe(10)
        expect(lajeRow.m2).toBe(20)
        expect(vigaRow.m2).toBe(null)
        expect(result.totalM2).toBe(30)
    })

    it('includes computed Fundo adicional de viga in row 3', () => {
        const fundo = makeFundoAdicional(5)
        const result = computeAreasDeForecimentoTable([fundo])
        const fundoRow = result.rows.find(
            (r) => r.label === 'Fundo adicional de viga'
        )!
        expect(fundoRow.m2).toBe(5)
        expect(result.totalM2).toBe(5)
    })

    it('jogos is 0 for every row', () => {
        const result = computeAreasDeForecimentoTable([makePilar(10)])
        expect(result.rows.every((row) => row.jogos === 0)).toBe(true)
    })

    it('rows are in fixed order: Pilar, Viga, Fundo adicional, Laje, Tira', () => {
        const result = computeAreasDeForecimentoTable([])
        expect(result.rows.map((r) => r.label)).toEqual([
            'Pilar',
            'Viga',
            'Fundo adicional de viga',
            'Laje',
            'Tira de reescoramento adicional',
        ])
    })
})

describe('deriveEspFromScope', () => {
    it('returns first segment of first chapa material name', () => {
        const scope: QuoteScope = {
            ...BASE_SCOPE,
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'cat',
                    materialType: 'chapa',
                    materialId: 7,
                    overrides: {},
                },
            ],
            materials: {
                '7': {
                    id: 7,
                    name: '15mm - 5L - Comb - Desc - 1 Proc',
                    value: 0,
                    type: 'chapa',
                    description: '',
                    supplierId: null,
                } as any,
            },
        }
        expect(deriveEspFromScope(scope)).toBe('15mm')
    })

    it('returns empty string when no chapa selection exists', () => {
        const scope: QuoteScope = {
            ...BASE_SCOPE,
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'cat',
                    materialType: 'ripa',
                    materialId: 3,
                    overrides: {},
                },
            ],
            materials: {
                '3': {
                    id: 3,
                    name: '20mm - ripa',
                    value: 0,
                    type: 'ripa',
                    description: '',
                    supplierId: null,
                } as any,
            },
        }
        expect(deriveEspFromScope(scope)).toBe('')
    })

    it('returns empty string when chapa snapshot is missing', () => {
        const scope: QuoteScope = {
            ...BASE_SCOPE,
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'cat',
                    materialType: 'chapa',
                    materialId: 99,
                    overrides: {},
                },
            ],
            materials: {},
        }
        expect(deriveEspFromScope(scope)).toBe('')
    })
})
