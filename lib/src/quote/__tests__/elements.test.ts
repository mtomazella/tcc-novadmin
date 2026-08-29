import { describe, expect, test } from 'vitest'
import type {
    QuoteElement,
    QuoteElementPilarValues,
    QuoteElementVigaValues,
    QuoteElementLajeValues,
} from 'types/quote.js'
import {
    appendPilarElementDerivedValues,
    appendVigaElementDerivedValues,
    appendLajeElementDerivedValues,
    appendElementDerivedValues,
    filterElementsAssignedToScope,
} from '../elements.js'
import { testElements } from './testElements.js'

describe('appendPilarElementDerivedValues', () => {
    test('calculates metragemM2 correctly with all required values', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'pilar',
            name: 'P101',
            values: {
                fundoCm: 14,
                lateralCm: 30,
                peDireitoM: 3.6,
                quantidade: 1,
                cambotado: false,
                needsGastalho: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        }

        const result = appendPilarElementDerivedValues(element)

        expect((result.values as QuoteElementPilarValues).metragemM2).toBe(4.75)
    })

    test('sets metragemM2 to undefined when fundoCm is missing', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'pilar',
            name: 'Test Pilar',
            values: {
                lateralCm: 30,
                peDireitoM: 3,
                quantidade: 2,
                cambotado: false,
                needsGastalho: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        } as QuoteElement

        const result = appendPilarElementDerivedValues(element)
        expect(
            (result.values as QuoteElementPilarValues).metragemM2
        ).toBeUndefined()
    })

    test('sets metragemM2 to undefined when lateralCm is missing', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'pilar',
            name: 'Test Pilar',
            values: {
                fundoCm: 20,
                peDireitoM: 3,
                quantidade: 2,
                cambotado: false,
                needsGastalho: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        } as QuoteElement

        const result = appendPilarElementDerivedValues(element)
        expect(
            (result.values as QuoteElementPilarValues).metragemM2
        ).toBeUndefined()
    })

    test('sets metragemM2 to undefined when peDireitoM is missing', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'pilar',
            name: 'Test Pilar',
            values: {
                fundoCm: 20,
                lateralCm: 30,
                quantidade: 2,
                cambotado: false,
                needsGastalho: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        } as QuoteElement

        const result = appendPilarElementDerivedValues(element)
        expect(
            (result.values as QuoteElementPilarValues).metragemM2
        ).toBeUndefined()
    })

    test('sets metragemM2 to undefined when quantidade is missing', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'pilar',
            name: 'Test Pilar',
            values: {
                fundoCm: 20,
                lateralCm: 30,
                peDireitoM: 3,
                cambotado: false,
                needsGastalho: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        } as QuoteElement

        const result = appendPilarElementDerivedValues(element)
        expect(
            (result.values as QuoteElementPilarValues).metragemM2
        ).toBeUndefined()
    })

    test('throws error when element type is not pilar', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'viga',
            name: 'Test Viga',
            values: {
                fundoCm: 20,
                lateralCm: 30,
                comprimentoCm: 400,
                alturaLajeLateralACm: 15,
                alturaLajeLateralBCm: 15,
                quantidade: 1,
                tipo: 'interno',
                cambotado: false,
                needsGarfo: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        }

        expect(() => appendPilarElementDerivedValues(element)).toThrow(
            'Element type must be pilar'
        )
    })

    test('does not mutate the original element', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'pilar',
            name: 'Test Pilar',
            values: {
                fundoCm: 20,
                lateralCm: 30,
                peDireitoM: 3,
                quantidade: 2,
                cambotado: false,
                needsGastalho: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        }

        const result = appendPilarElementDerivedValues(element)

        expect(result).not.toBe(element)
        expect(
            (element.values as QuoteElementPilarValues).metragemM2
        ).toBeUndefined()
    })
})

describe('appendVigaElementDerivedValues', () => {
    test('calculates fundoDeVigaM2 and lateralDeVigaM2 correctly with all required values', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'viga',
            name: 'V1',
            values: {
                fundoCm: 14,
                lateralCm: 55,
                comprimentoCm: 874,
                alturaLajeLateralACm: 0,
                alturaLajeLateralBCm: 0,
                quantidade: 1,
                tipo: 'interno',
                cambotado: false,
                needsGarfo: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        }

        const result = appendVigaElementDerivedValues(element)

        expect((result.values as QuoteElementVigaValues).fundoDeVigaM2).toBe(
            1.22
        )

        expect((result.values as QuoteElementVigaValues).lateralDeVigaM2).toBe(
            10.31
        )
    })

    test('sets fundoDeVigaM2 to undefined when fundoCm is missing', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'viga',
            name: 'Test Viga',
            values: {
                lateralCm: 40,
                comprimentoCm: 500,
                alturaLajeLateralACm: 12,
                alturaLajeLateralBCm: 10,
                quantidade: 2,
                tipo: 'interno',
                cambotado: false,
                needsGarfo: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        } as QuoteElement

        const result = appendVigaElementDerivedValues(element)
        expect(
            (result.values as QuoteElementVigaValues).fundoDeVigaM2
        ).toBeUndefined()
    })

    test('sets fundoDeVigaM2 to undefined when comprimentoCm is missing', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'viga',
            name: 'Test Viga',
            values: {
                fundoCm: 25,
                lateralCm: 40,
                alturaLajeLateralACm: 12,
                alturaLajeLateralBCm: 10,
                quantidade: 2,
                tipo: 'interno',
                cambotado: false,
                needsGarfo: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        } as QuoteElement

        const result = appendVigaElementDerivedValues(element)
        expect(
            (result.values as QuoteElementVigaValues).fundoDeVigaM2
        ).toBeUndefined()
    })

    test('sets fundoDeVigaM2 to undefined when quantidade is missing', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'viga',
            name: 'Test Viga',
            values: {
                fundoCm: 25,
                lateralCm: 40,
                comprimentoCm: 500,
                alturaLajeLateralACm: 12,
                alturaLajeLateralBCm: 10,
                tipo: 'interno',
                cambotado: false,
                needsGarfo: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        } as QuoteElement

        const result = appendVigaElementDerivedValues(element)
        expect(
            (result.values as QuoteElementVigaValues).fundoDeVigaM2
        ).toBeUndefined()
    })

    test('sets lateralDeVigaM2 to undefined when lateralCm is missing', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'viga',
            name: 'Test Viga',
            values: {
                fundoCm: 25,
                comprimentoCm: 500,
                alturaLajeLateralACm: 12,
                alturaLajeLateralBCm: 10,
                quantidade: 2,
                tipo: 'interno',
                cambotado: false,
                needsGarfo: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        } as QuoteElement

        const result = appendVigaElementDerivedValues(element)
        expect(
            (result.values as QuoteElementVigaValues).lateralDeVigaM2
        ).toBeUndefined()
    })

    test('sets lateralDeVigaM2 to undefined when alturaLajeLateralACm is missing', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'viga',
            name: 'Test Viga',
            values: {
                fundoCm: 25,
                lateralCm: 40,
                comprimentoCm: 500,
                alturaLajeLateralBCm: 10,
                quantidade: 2,
                tipo: 'interno',
                cambotado: false,
                needsGarfo: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        } as QuoteElement

        const result = appendVigaElementDerivedValues(element)
        expect(
            (result.values as QuoteElementVigaValues).lateralDeVigaM2
        ).toBeUndefined()
    })

    test('sets lateralDeVigaM2 to undefined when alturaLajeLateralBCm is missing', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'viga',
            name: 'Test Viga',
            values: {
                fundoCm: 25,
                lateralCm: 40,
                comprimentoCm: 500,
                alturaLajeLateralACm: 12,
                quantidade: 2,
                tipo: 'interno',
                cambotado: false,
                needsGarfo: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        } as QuoteElement

        const result = appendVigaElementDerivedValues(element)
        expect(
            (result.values as QuoteElementVigaValues).lateralDeVigaM2
        ).toBeUndefined()
    })

    test('throws error when element type is not viga', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'pilar',
            name: 'Test Pilar',
            values: {
                fundoCm: 20,
                lateralCm: 30,
                peDireitoM: 3,
                quantidade: 2,
                cambotado: false,
                needsGastalho: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        }

        expect(() => appendVigaElementDerivedValues(element)).toThrow(
            'Element type must be viga'
        )
    })

    test('does not mutate the original element', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'viga',
            name: 'Test Viga',
            values: {
                fundoCm: 25,
                lateralCm: 40,
                comprimentoCm: 500,
                alturaLajeLateralACm: 12,
                alturaLajeLateralBCm: 10,
                quantidade: 2,
                tipo: 'interno',
                cambotado: false,
                needsGarfo: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        }

        const result = appendVigaElementDerivedValues(element)

        expect(result).not.toBe(element)
        expect(
            (element.values as QuoteElementVigaValues).fundoDeVigaM2
        ).toBeUndefined()
        expect(
            (element.values as QuoteElementVigaValues).lateralDeVigaM2
        ).toBeUndefined()
    })
})

describe('appendLajeElementDerivedValues', () => {
    test('calculates metragemM2 correctly with all required values', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'laje',
            name: 'L2',
            values: {
                areaM2: 21.9,
                perimetroM: 30,
                fechamentoM2: 10,
                quantidade: 1,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        }

        const result = appendLajeElementDerivedValues(element)

        expect((result.values as QuoteElementLajeValues).metragemM2).toBe(21.9)
    })

    test('calculates faixasAdicionaisM2 correctly for L129 example', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'laje',
            name: 'L129',
            values: {
                areaM2: 1.99,
                perimetroM: 5.65,
                fechamentoM2: 0.0,
                quantidade: 1,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        }

        const result = appendLajeElementDerivedValues(element)

        expect(
            (result.values as QuoteElementLajeValues).faixasAdicionaisM2
        ).toBe(0.12)
    })

    test('sets metragemM2 to undefined when areaM2 is missing', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'laje',
            name: 'Test Laje',
            values: {
                perimetroM: 30,
                fechamentoM2: 10,
                quantidade: 3,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        } as QuoteElement

        const result = appendLajeElementDerivedValues(element)
        expect(
            (result.values as QuoteElementLajeValues).metragemM2
        ).toBeUndefined()
    })

    test('sets metragemM2 to undefined when quantidade is missing', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'laje',
            name: 'Test Laje',
            values: {
                areaM2: 50,
                perimetroM: 30,
                fechamentoM2: 10,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        } as QuoteElement

        const result = appendLajeElementDerivedValues(element)
        expect(
            (result.values as QuoteElementLajeValues).metragemM2
        ).toBeUndefined()
    })

    test('throws error when element type is not laje', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'pilar',
            name: 'Test Pilar',
            values: {
                fundoCm: 20,
                lateralCm: 30,
                peDireitoM: 3,
                quantidade: 2,
                cambotado: false,
                needsGastalho: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        }

        expect(() => appendLajeElementDerivedValues(element)).toThrow(
            'Element type must be laje'
        )
    })

    test('does not mutate the original element', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'laje',
            name: 'Test Laje',
            values: {
                areaM2: 50,
                perimetroM: 30,
                fechamentoM2: 10,
                quantidade: 3,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        }

        const result = appendLajeElementDerivedValues(element)

        expect(result).not.toBe(element)
        expect(
            (element.values as QuoteElementLajeValues).metragemM2
        ).toBeUndefined()
    })
})

describe('appendElementDerivedValues', () => {
    test('dispatches to appendPilarElementDerivedValues for pilar type', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'pilar',
            name: 'Test Pilar',
            values: {
                fundoCm: 20,
                lateralCm: 30,
                peDireitoM: 3,
                quantidade: 2,
                cambotado: false,
                needsGastalho: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        }

        const result = appendElementDerivedValues(element)

        expect((result.values as QuoteElementPilarValues).metragemM2).toBe(8.64)
    })

    test('dispatches to appendVigaElementDerivedValues for viga type', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'viga',
            name: 'Test Viga',
            values: {
                fundoCm: 25,
                lateralCm: 40,
                comprimentoCm: 500,
                alturaLajeLateralACm: 12,
                alturaLajeLateralBCm: 10,
                quantidade: 2,
                tipo: 'interno',
                cambotado: false,
                needsGarfo: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        }

        const result = appendElementDerivedValues(element)

        expect((result.values as QuoteElementVigaValues).fundoDeVigaM2).toBe(
            2.5
        )
        expect((result.values as QuoteElementVigaValues).lateralDeVigaM2).toBe(
            6.6
        )
    })

    test('dispatches to appendLajeElementDerivedValues for laje type', () => {
        const element: QuoteElement = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'laje',
            name: 'Test Laje',
            values: {
                areaM2: 50,
                perimetroM: 30,
                fechamentoM2: 10,
                quantidade: 3,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        }

        const result = appendElementDerivedValues(element)

        // Expected calculation:
        // metragemM2 = 50 * 3 = 150
        expect((result.values as QuoteElementLajeValues).metragemM2).toBe(150)
    })

    test('throws error for unknown element type', () => {
        const element = {
            id: 1,
            quoteId: 1,
            scopeId: 1,
            productId: 1,
            type: 'unknown',
            name: 'Test Unknown',
            values: {},
        } as any

        expect(() => appendElementDerivedValues(element)).toThrow(
            'Unknown element type: unknown'
        )
    })
})

describe('appendElementDerivedValues integration tests', () => {
    test('calculates derived values for multiple elements', () => {
        const results = testElements.map((element) =>
            appendElementDerivedValues(element as QuoteElement)
        )

        for (let i = 0; i < results.length; i++) {
            const result = results[i]
            const expected = testElements[i]

            if (result.type === 'pilar') {
                expect(
                    (result.values as QuoteElementPilarValues).metragemM2
                ).toBeCloseTo(
                    (expected.values as QuoteElementPilarValues)
                        .metragemM2 as number,
                    1
                )
            } else if (result.type === 'viga') {
                expect(
                    (result.values as QuoteElementVigaValues).fundoDeVigaM2
                ).toBeCloseTo(
                    (expected.values as QuoteElementVigaValues)
                        .fundoDeVigaM2 as number,
                    1
                )
                expect(
                    (result.values as QuoteElementVigaValues).lateralDeVigaM2
                ).toBeCloseTo(
                    (expected.values as QuoteElementVigaValues)
                        .lateralDeVigaM2 as number,
                    1
                )
            } else if (result.type === 'laje') {
                expect(
                    (result.values as QuoteElementLajeValues).metragemM2
                ).toBeCloseTo(
                    (expected.values as QuoteElementLajeValues)
                        .metragemM2 as number,
                    1
                )
                expect(
                    (result.values as QuoteElementLajeValues).faixasAdicionaisM2
                ).toBeCloseTo(
                    (expected.values as QuoteElementLajeValues)
                        .faixasAdicionaisM2 as number,
                    1
                )
            }
        }
    })
})

describe('filterElementsAssignedToScope', () => {
    const createMockElement = (
        overrides?: Partial<QuoteElement>
    ): QuoteElement => ({
        id: 1,
        quoteId: 100,
        scopeId: 1,
        productId: 10,
        type: 'pilar',
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
        },
        ...overrides,
    })

    test('returns an empty array for an empty input', () => {
        expect(filterElementsAssignedToScope([])).toEqual([])
    })

    test('keeps all elements when every element has a scopeId', () => {
        const elements = [
            createMockElement({ id: 1, scopeId: 1 }),
            createMockElement({ id: 2, scopeId: 2 }),
        ]
        expect(filterElementsAssignedToScope(elements)).toEqual(elements)
    })

    test('drops all elements when every element has scopeId null', () => {
        const elements = [
            createMockElement({ id: 1, scopeId: null }),
            createMockElement({ id: 2, scopeId: null }),
        ]
        expect(filterElementsAssignedToScope(elements)).toEqual([])
    })

    test('keeps only elements with a non-null scopeId in a mixed list', () => {
        const withScope = createMockElement({ id: 1, scopeId: 1 })
        const withoutScope = createMockElement({ id: 2, scopeId: null })
        const result = filterElementsAssignedToScope([withScope, withoutScope])
        expect(result).toEqual([withScope])
    })
})
