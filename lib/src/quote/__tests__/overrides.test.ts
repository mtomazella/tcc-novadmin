import { describe, expect, test } from 'vitest'
import type {
    Material,
    Product,
    Quote,
    QuoteFixedCost,
    QuoteProductConsumption,
    QuoteScope,
} from 'types/index.js'
import {
    getOverriddenFixedCosts,
    getOverriddenMaterialSelectionValue,
    getOverriddenProductConsumption,
} from '../overrides.js'

const baseFixedCosts: QuoteFixedCost[] = [
    {
        id: 'administrativo',
        name: 'Administrativo',
        valueType: 'price',
        value: 100,
    },
    {
        id: 'logistica',
        name: 'Logistica',
        valueType: 'price',
        value: 200,
    },
]

const product: Product = {
    id: 10,
    name: 'Chapa Padrão',
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
        icChapa1: 1,
        icRipa1: 2,
        icChapa2: 3,
        icRipa2: 4,
        icChapa3: 5,
        icRipa3: 6,
    },
}

const quoteConsumption: QuoteProductConsumption = {
    id: 10,
    category: 'pilar+10+ripado',
    commercialPercentage: null,
    projectPercentage: null,
    consumptionRates: {
        icChapa1: 10,
        icRipa1: 20,
        icChapa2: 30,
        icRipa2: 40,
        icChapa3: 50,
        icRipa3: 60,
    },
}

const scopeConsumption: QuoteProductConsumption = {
    id: 10,
    category: 'pilar+10+ripado',
    commercialPercentage: null,
    projectPercentage: null,
    consumptionRates: {
        icChapa1: 100,
        icRipa1: 200,
        icChapa2: 300,
        icRipa2: 400,
        icChapa3: 500,
        icRipa3: 600,
    },
}

describe('getOverriddenFixedCosts', () => {
    test('applies quote overrides and then scope overrides with correct precedence', () => {
        const quote = {
            fixedCosts: [
                {
                    id: 'administrativo',
                    name: 'Administrativo',
                    valueType: 'price',
                    value: 150,
                },
            ],
        } as Quote

        const scope = {
            overriddenFixedCosts: [
                {
                    id: 'administrativo',
                    name: 'Administrativo',
                    valueType: 'price',
                    value: 180,
                },
                {
                    id: 'logistica',
                    name: 'Logistica',
                    valueType: 'price',
                    value: 250,
                },
            ],
        } as QuoteScope

        const result = getOverriddenFixedCosts({
            fixedCosts: baseFixedCosts,
            quote,
            scope,
            overrideLevel: 'scope',
        })

        expect(result.find((item) => item.id === 'administrativo')?.value).toBe(
            180
        )
        expect(result.find((item) => item.id === 'logistica')?.value).toBe(250)
    })

    test('applies only quote overrides when override level is quote', () => {
        const quote = {
            fixedCosts: [
                {
                    id: 'administrativo',
                    name: 'Administrativo',
                    valueType: 'price',
                    value: 150,
                },
            ],
        } as Quote

        const scope = {
            overriddenFixedCosts: [
                {
                    id: 'administrativo',
                    name: 'Administrativo',
                    valueType: 'price',
                    value: 180,
                },
                {
                    id: 'logistica',
                    name: 'Logistica',
                    valueType: 'price',
                    value: 250,
                },
            ],
        } as QuoteScope

        const result = getOverriddenFixedCosts({
            fixedCosts: baseFixedCosts,
            quote,
            scope,
            overrideLevel: 'quote',
        })

        expect(result.find((item) => item.id === 'administrativo')?.value).toBe(
            150
        )
        expect(result.find((item) => item.id === 'logistica')?.value).toBe(200)
    })

    test('returns clone when override level is fixedCosts', () => {
        const result = getOverriddenFixedCosts({
            fixedCosts: baseFixedCosts,
            overrideLevel: 'fixedCosts',
        })

        expect(result).toEqual(baseFixedCosts)
        expect(result).not.toBe(baseFixedCosts)
    })

    test('throws when quote is required but missing', () => {
        expect(() =>
            getOverriddenFixedCosts({
                fixedCosts: baseFixedCosts,
                overrideLevel: 'quote',
            })
        ).toThrow('Quote data is required for quote level overrides')
    })

    test('throws when scope is required but missing', () => {
        const quote = { fixedCosts: [] } as unknown as Quote

        expect(() =>
            getOverriddenFixedCosts({
                fixedCosts: baseFixedCosts,
                quote,
                overrideLevel: 'scope',
            })
        ).toThrow('Scope data is required for scope level overrides')
    })
})

describe('getOverriddenProductConsumption', () => {
    test('applies quote and then scope product consumption overrides', () => {
        const quote = {
            productConsumption: [quoteConsumption],
        } as Quote

        const scope = {
            overriddenProductConsumption: [scopeConsumption],
        } as QuoteScope

        const result = getOverriddenProductConsumption({
            product,
            quote,
            scope,
            overrideLevel: 'scope',
        })

        expect(result.consumptionRates.icChapa1).toBe(100)
        expect(result.consumptionRates.icRipa3).toBe(600)
    })

    test('applies only quote overrides when override level is quote', () => {
        const quote = {
            productConsumption: [quoteConsumption],
        } as Quote

        const scope = {
            overriddenProductConsumption: [scopeConsumption],
        } as QuoteScope

        const result = getOverriddenProductConsumption({
            product,
            quote,
            scope,
            overrideLevel: 'quote',
        })

        expect(result.consumptionRates.icChapa1).toBe(10)
        expect(result.consumptionRates.icRipa3).toBe(60)
    })

    test('returns clone of product consumption when override level is product', () => {
        const result = getOverriddenProductConsumption({
            product,
            overrideLevel: 'product',
        })

        expect(result.consumptionRates).toEqual(product.consumptionRates)
        expect(result.consumptionRates).not.toBe(product.consumptionRates)
    })

    test('throws when quote is required but missing', () => {
        expect(() =>
            getOverriddenProductConsumption({
                product,
                overrideLevel: 'quote',
            })
        ).toThrow('Quote data is required for quote level overrides')
    })

    test('throws when scope is required but missing', () => {
        const quote = {
            productConsumption: [quoteConsumption],
        } as Quote

        expect(() =>
            getOverriddenProductConsumption({
                product,
                quote,
                overrideLevel: 'scope',
            })
        ).toThrow('Scope data is required for scope level overrides')
    })

    test('null override rates do not wipe product base rates', () => {
        const draftOverride: QuoteProductConsumption = {
            id: 10,
            category: 'pilar+10',
            commercialPercentage: null,
            projectPercentage: null,
            consumptionRates: {
                icChapa1: 99,
                icRipa1: null,
                icChapa2: null,
                icRipa2: null,
                icChapa3: null,
                icRipa3: null,
            },
        }

        const quote = {
            productConsumption: [draftOverride],
        } as Quote

        const result = getOverriddenProductConsumption({
            product,
            quote,
            overrideLevel: 'quote',
        })

        expect(result.consumptionRates.icChapa1).toBe(99)
        expect(result.consumptionRates.icRipa1).toBe(
            product.consumptionRates!.icRipa1
        )
        expect(result.consumptionRates.icChapa2).toBe(
            product.consumptionRates!.icChapa2
        )
        expect(result.consumptionRates.icRipa2).toBe(
            product.consumptionRates!.icRipa2
        )
        expect(result.consumptionRates.icChapa3).toBe(
            product.consumptionRates!.icChapa3
        )
        expect(result.consumptionRates.icRipa3).toBe(
            product.consumptionRates!.icRipa3
        )
    })
})

describe('getOverriddenMaterialSelectionValue', () => {
    test('uses scope material snapshot at scope_snapshot level', () => {
        const material: Material = {
            id: 7,
            supplierId: 1,
            sku: 'CH-001',
            name: 'Chapa',
            type: 'chapa',
            value: 10,
        }

        const scope = {
            materials: {
                '7': {
                    id: 7,
                    supplierId: 1,
                    sku: 'CH-001',
                    name: 'Chapa',
                    type: 'chapa',
                    value: 25,
                },
            },
            materialSelections: [],
        } as unknown as QuoteScope

        const result = getOverriddenMaterialSelectionValue({
            material,
            scope,
            category: 'pilar+10+ripado',
            overriddenLevel: 'scope_snapshot',
        })

        expect(result).toBe(25)
    })

    test('uses selection override at scope_selection level', () => {
        const material: Material = {
            id: 7,
            supplierId: 1,
            sku: 'CH-001',
            name: 'Chapa',
            type: 'chapa',
            value: 10,
        }

        const scope = {
            materials: {
                '7': {
                    id: 7,
                    supplierId: 1,
                    sku: 'CH-001',
                    name: 'Chapa',
                    type: 'chapa',
                    value: 25,
                },
            },
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'pilar+10+ripado',
                    materialType: 'chapa',
                    materialId: 7,
                    overrides: {
                        value: 33,
                    },
                },
            ],
        } as unknown as QuoteScope

        const result = getOverriddenMaterialSelectionValue({
            material,
            scope,
            category: 'pilar+10+ripado',
            overriddenLevel: 'scope_selection',
        })

        expect(result).toBe(33)
    })

    test('uses material value when no overrides are present', () => {
        const material: Material = {
            id: 7,
            supplierId: 1,
            sku: 'CH-001',
            name: 'Chapa',
            type: 'chapa',
            value: 10,
        }

        const scope = {
            materials: {
                '8': {
                    id: 8,
                    supplierId: 1,
                    sku: 'RI-001',
                    name: 'Ripa',
                    type: 'ripa',
                    value: 5,
                },
            },
            materialSelections: [
                {
                    elementType: 'pilar',
                    category: 'pilar+10+ripado',
                    materialType: 'chapa',
                    materialId: 8,
                    overrides: {
                        value: 33,
                    },
                },
            ],
        } as unknown as QuoteScope

        const result = getOverriddenMaterialSelectionValue({
            material,
            scope,
            category: 'pilar+7+ripado',
            overriddenLevel: 'scope_selection',
        })

        expect(result).toBe(10)
    })

    test('uses material value at material override level', () => {
        const material: Material = {
            id: 7,
            supplierId: 1,
            sku: 'CH-001',
            name: 'Chapa',
            type: 'chapa',
            value: 10,
        }

        const result = getOverriddenMaterialSelectionValue({
            material,
            category: 'pilar+10+ripado',
            overriddenLevel: 'material',
        })

        expect(result).toBe(10)
    })

    test('throws when scope selection level has empty category', () => {
        const material: Material = {
            id: 7,
            supplierId: 1,
            sku: 'CH-001',
            name: 'Chapa',
            type: 'chapa',
            value: 10,
        }

        const scope = {
            materials: {},
            materialSelections: [],
        } as unknown as QuoteScope

        expect(() =>
            getOverriddenMaterialSelectionValue({
                material,
                scope,
                category: '',
                overriddenLevel: 'scope_selection',
            })
        ).toThrow('Category is required for scope selection overrides')
    })

    test('throws when scope data is required but missing', () => {
        const material: Material = {
            id: 7,
            supplierId: 1,
            sku: 'CH-001',
            name: 'Chapa',
            type: 'chapa',
            value: 10,
        }

        expect(() =>
            getOverriddenMaterialSelectionValue({
                material,
                category: 'pilar+10+ripado',
                overriddenLevel: 'scope_snapshot',
            })
        ).toThrow('Scope data is required for scope level overrides')
    })
})
