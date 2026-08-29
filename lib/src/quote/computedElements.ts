import type {
    IncludeDatabaseDates,
    Product,
    QuoteElement,
    QuoteElementLajeValues,
    QuoteElementPilarValues,
    QuoteElementVigaValues,
    QuoteScope,
} from 'types/index.js'
import { normalizeNumber, round } from 'utils/unitConversion.js'
import {
    FUNDO_ADICIONAL_PRODUCT_ID,
    TIRA_ADICIONAL_PRODUCT_ID,
    GARFO_PRODUCT_ID,
    GASTALHO_PRODUCT_ID,
} from './constants.js'
import { buildCategory } from './groupedElements.js'

export const generateComputedElements = (
    elements: QuoteElement[],
    scopes: QuoteScope[],
    productLookup?: Map<number, IncludeDatabaseDates<Product>>
): QuoteElement[] => {
    const computed: QuoteElement[] = []

    for (const scope of scopes) {
        if (!scope.id) continue
        const scopeElements = elements.filter((e) => e.scopeId === scope.id)

        const fundoAdicionalCount = normalizeNumber(scope.fundoAdicionalCount)
        const vigaElements = scopeElements.filter((e) => e.type === 'viga')
        if (fundoAdicionalCount > 0 && vigaElements.length > 0) {
            const totalQuantidade = vigaElements.reduce(
                (sum, e) => sum + normalizeNumber(e.values.quantidade),
                0
            )
            const totalFundoDeVigaM2 = vigaElements.reduce(
                (sum, e) =>
                    sum +
                    normalizeNumber(
                        (e.values as QuoteElementVigaValues).fundoDeVigaM2
                    ),
                0
            )
            const product =
                productLookup?.get(FUNDO_ADICIONAL_PRODUCT_ID) ?? null
            computed.push({
                quoteId: scope.quoteId,
                scopeId: scope.id,
                productId: FUNDO_ADICIONAL_PRODUCT_ID,
                type: product?.typeOnQuote ?? 'outro',
                name: product?.name ?? '',
                category: buildCategory({
                    type: product?.typeOnQuote ?? 'outro',
                    productId: FUNDO_ADICIONAL_PRODUCT_ID,
                    modifiers: product?.modifiers ?? {},
                }),
                product,
                values: {
                    quantidade: Math.round(
                        totalQuantidade * fundoAdicionalCount
                    ),
                    metragemM2: round(totalFundoDeVigaM2 * fundoAdicionalCount),
                },
            })
        }

        const tiraAdicionalCount = normalizeNumber(scope.tiraAdicionalCount)
        const lajeElements = scopeElements.filter((e) => e.type === 'laje')
        if (tiraAdicionalCount > 0 && lajeElements.length > 0) {
            const totalQuantidade = lajeElements.reduce(
                (sum, e) => sum + normalizeNumber(e.values.quantidade),
                0
            )
            const totalFaixasAdicionaisM2 = lajeElements.reduce(
                (sum, e) =>
                    sum +
                    normalizeNumber(
                        (e.values as QuoteElementLajeValues).faixasAdicionaisM2
                    ),
                0
            )
            const product =
                productLookup?.get(TIRA_ADICIONAL_PRODUCT_ID) ?? null
            computed.push({
                quoteId: scope.quoteId,
                scopeId: scope.id,
                productId: TIRA_ADICIONAL_PRODUCT_ID,
                type: product?.typeOnQuote ?? 'outro',
                name: product?.name ?? '',
                category: buildCategory({
                    type: product?.typeOnQuote ?? 'outro',
                    productId: TIRA_ADICIONAL_PRODUCT_ID,
                    modifiers: product?.modifiers ?? {},
                }),
                product,
                values: {
                    quantidade: Math.round(
                        totalQuantidade * tiraAdicionalCount
                    ),
                    metragemM2: round(
                        totalFaixasAdicionaisM2 * tiraAdicionalCount
                    ),
                },
            })
        }

        const garfoBordaEnabled = scope.garfoBordaEnabled === true
        const garfoInternoEnabled = scope.garfoInternoEnabled === true
        const applicableGarfoVigas = scopeElements.filter((e) => {
            if (e.type !== 'viga') return false
            const vigaValues = e.values as QuoteElementVigaValues
            return (
                vigaValues.needsGarfo === true ||
                (vigaValues.tipo === 'borda' && garfoBordaEnabled) ||
                (vigaValues.tipo === 'interno' && garfoInternoEnabled)
            )
        })
        if (applicableGarfoVigas.length > 0) {
            const totalComprimentoCm = applicableGarfoVigas.reduce(
                (sum, e) =>
                    sum +
                    normalizeNumber(
                        (e.values as QuoteElementVigaValues).comprimentoCm
                    ),
                0
            )
            const product = productLookup?.get(GARFO_PRODUCT_ID) ?? null
            computed.push({
                quoteId: scope.quoteId,
                scopeId: scope.id,
                productId: GARFO_PRODUCT_ID,
                type: product?.typeOnQuote ?? 'outro',
                name: product?.name ?? '',
                category: buildCategory({
                    type: product?.typeOnQuote ?? 'outro',
                    productId: GARFO_PRODUCT_ID,
                    modifiers: product?.modifiers ?? {},
                }),
                product,
                values: {
                    quantidade: Math.round((totalComprimentoCm / 100) * 2),
                    metragemM2: 0,
                },
            })
        }

        const gastalhoCount = normalizeNumber(scope.gastalhoCount)
        const elementsWithGastalho = scopeElements.filter(
            (e) => (e.values as QuoteElementPilarValues).needsGastalho === true
        )
        if (gastalhoCount > 0 && elementsWithGastalho.length > 0) {
            const pilarQuantity = elementsWithGastalho.reduce(
                (sum, e) => sum + normalizeNumber(e.values.quantidade),
                0
            )
            const sumPilarPerimeter = elementsWithGastalho.reduce(
                (sum, e) =>
                    sum +
                    (normalizeNumber(
                        (e.values as QuoteElementVigaValues).fundoCm
                    ) +
                        normalizeNumber(
                            (e.values as QuoteElementVigaValues).lateralCm
                        )),
                0
            )
            // (((SOMA(C23:D)/100)+((120*C11)/100))/3)*P6
            const quantity =
                ((sumPilarPerimeter / 100 + 1.2 * pilarQuantity) / 3) *
                gastalhoCount
            const product = productLookup?.get(GASTALHO_PRODUCT_ID) ?? null
            computed.push({
                quoteId: scope.quoteId,
                scopeId: scope.id,
                productId: GASTALHO_PRODUCT_ID,
                type: product?.typeOnQuote ?? 'outro',
                name: product?.name ?? '',
                category: buildCategory({
                    type: product?.typeOnQuote ?? 'outro',
                    productId: GASTALHO_PRODUCT_ID,
                    modifiers: product?.modifiers ?? {},
                }),
                product,
                values: {
                    quantidade: Math.round(quantity),
                    metragemM2: 0,
                },
            })
        }
    }

    return computed
}

export interface GarfoPieceCounts {
    bordaCount: number
    internoCount: number
}

// Derives the borda/interno breakdown the document needs by re-running
// generateComputedElements against each tipo's vigas in isolation, rather
// than reimplementing the piece-count math here.
export const computeGarfoPieceCounts = (
    elements: QuoteElement[],
    scopes: QuoteScope[]
): GarfoPieceCounts => {
    const sumGarfoQuantidade = (vigas: QuoteElement[]): number =>
        generateComputedElements(vigas, scopes)
            .filter((e) => e.productId === GARFO_PRODUCT_ID)
            .reduce((sum, e) => sum + normalizeNumber(e.values.quantidade), 0)

    const bordaVigas = elements.filter(
        (e) =>
            e.type === 'viga' &&
            (e.values as QuoteElementVigaValues).tipo === 'borda'
    )
    const internoVigas = elements.filter(
        (e) =>
            e.type === 'viga' &&
            (e.values as QuoteElementVigaValues).tipo === 'interno'
    )

    return {
        bordaCount: sumGarfoQuantidade(bordaVigas),
        internoCount: sumGarfoQuantidade(internoVigas),
    }
}
