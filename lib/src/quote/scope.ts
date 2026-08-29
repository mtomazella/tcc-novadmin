import type { QuoteElement } from 'types/quote.js'
import {
    computeFundoAdicionalCount,
    computeGarfoCount,
    computeGastalhoCount,
    computeTiraAdicionalCount,
} from './elements.js'

export type ScopeComputedCounts = {
    gastalhoCount: number
    garfoCount: number
    fundoAdicionalCount: number
    tiraAdicionalCount: number
}

export const computeScopeAdditionalElements = (
    elements: QuoteElement[]
): ScopeComputedCounts => ({
    gastalhoCount: computeGastalhoCount(elements),
    garfoCount: computeGarfoCount(elements),
    fundoAdicionalCount: computeFundoAdicionalCount(elements),
    tiraAdicionalCount: computeTiraAdicionalCount(elements),
})
