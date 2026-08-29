import lodash from 'lodash'
const { cloneDeep } = lodash
import type {
    QuoteElement,
    QuoteElementLajeValues,
    QuoteElementPilarValues,
    QuoteElementType,
    QuoteElementVigaValues,
} from 'types/quote.js'
import {
    cm2ToM2,
    cmToM,
    falsyExceptZero,
    normalizeNumber,
    round,
} from 'utils/unitConversion.js'

export const getElementM2 = (element: QuoteElement): number =>
    ((element.values as QuoteElementPilarValues | QuoteElementLajeValues)
        ?.metragemM2 ?? 0) +
    ((element.values as QuoteElementVigaValues)?.fundoDeVigaM2 ?? 0) +
    ((element.values as QuoteElementVigaValues)?.lateralDeVigaM2 ?? 0)

export const modifierFieldsByType: Record<QuoteElementType, string[]> = {
    pilar: ['cambotado', 'needsGastalho', 'ripado', 'aparente', 'paginado'],
    viga: ['cambotado', 'needsGarfo', 'ripado', 'aparente', 'paginado'],
    laje: ['ripado', 'aparente', 'paginado'],
    outro: ['garfo', 'gastalho', 'fundoDeViga'],
}

export const defaultValuesByType: Record<
    QuoteElementType,
    Record<string, unknown>
> = {
    pilar: {
        fundoCm: 0,
        lateralCm: 0,
        peDireitoM: 0,
        quantidade: 1,
        cambotado: false,
        needsGastalho: false,
        ripado: false,
        aparente: false,
        paginado: false,
        metragemM2: 0,
    },
    viga: {
        fundoCm: 0,
        lateralCm: 0,
        comprimentoCm: 0,
        alturaLajeLateralACm: 0,
        alturaLajeLateralBCm: 0,
        quantidade: 1,
        tipo: 'interno',
        cambotado: false,
        needsGarfo: false,
        ripado: false,
        aparente: false,
        paginado: false,
        fundoDeVigaM2: 0,
        lateralDeVigaM2: 0,
    },
    laje: {
        areaM2: 0,
        perimetroM: 0,
        fechamentoM2: 0,
        quantidade: 1,
        ripado: false,
        aparente: false,
        paginado: false,
        faixasAdicionaisM2: 0,
        metragemM2: 0,
    },
    outro: {
        quantidade: 1,
        metragemM2: 0,
    },
}

export const appendPilarElementDerivedValues = (element: QuoteElement) => {
    if (element.type !== 'pilar') throw new Error('Element type must be pilar')

    element = cloneDeep(element)
    element.values = element.values as QuoteElementPilarValues

    if (
        falsyExceptZero(element.values.fundoCm) ||
        falsyExceptZero(element.values.lateralCm) ||
        falsyExceptZero(element.values.peDireitoM) ||
        falsyExceptZero(element.values.quantidade)
    ) {
        element.values.metragemM2 = undefined
        return element
    } else {
        // =SE(ÉCÉL.VAZIA(B23)=FALSO;(((C23/100)*2)+((D23/100)*2)+0,44)*E23;)
        // =((((((D24*2)+(E24*2))+44)*F24)*H24))/100
        element.values.metragemM2 = round(
            (cmToM(element.values.fundoCm) * 2 +
                cmToM(element.values.lateralCm) * 2 +
                0.44) *
                element.values.peDireitoM *
                element.values.quantidade
        )
    }

    return element
}

export const appendVigaElementDerivedValues = (element: QuoteElement) => {
    if (element.type !== 'viga') throw new Error('Element type must be viga')

    element = cloneDeep(element)
    element.values = element.values as QuoteElementVigaValues

    if (
        falsyExceptZero(element.values.fundoCm) ||
        falsyExceptZero(element.values.comprimentoCm) ||
        falsyExceptZero(element.values.quantidade)
    ) {
        element.values.fundoDeVigaM2 = undefined
        return element
    } else {
        // =(M23*S23)/10000
        element.values.fundoDeVigaM2 = round(
            cm2ToM2(
                element.values.fundoCm *
                    element.values.comprimentoCm *
                    element.values.quantidade
            )
        )
    }

    if (
        falsyExceptZero(element.values.lateralCm) ||
        falsyExceptZero(element.values.comprimentoCm) ||
        falsyExceptZero(element.values.alturaLajeLateralACm) ||
        falsyExceptZero(element.values.alturaLajeLateralBCm) ||
        falsyExceptZero(element.values.quantidade)
    ) {
        element.values.lateralDeVigaM2 = undefined
        return element
    } else {
        // =SE(ÉCÉL.VAZIA(L23)=FALSO;(((Q23+4-N23)+(Q23+4-P23))*S23)/10000;)
        // =(((((R26+4-P26)+(S26+4-Q26))*T26)*U26)/10000)
        element.values.lateralDeVigaM2 = round(
            cm2ToM2(
                (element.values.lateralCm +
                    4 -
                    element.values.alturaLajeLateralACm +
                    (element.values.lateralCm +
                        4 -
                        element.values.alturaLajeLateralBCm)) *
                    element.values.comprimentoCm *
                    element.values.quantidade
            )
        )
    }

    return element
}

export const appendLajeElementDerivedValues = (element: QuoteElement) => {
    if (element.type !== 'laje') throw new Error('Element type must be laje')

    element = cloneDeep(element)
    element.values = element.values as QuoteElementLajeValues

    if (
        falsyExceptZero(element.values.areaM2) ||
        falsyExceptZero(element.values.quantidade)
    ) {
        element.values.metragemM2 = undefined
        return element
    } else {
        element.values.metragemM2 = round(
            element.values.areaM2 * element.values.quantidade
        )
        // =(AA23/100)*6
        element.values.faixasAdicionaisM2 = round(
            (element.values.areaM2 / 100) * 6
        )
    }

    return element
}

export const appendElementDerivedValues = (element: QuoteElement) => {
    switch (element.type) {
        case 'pilar':
            return appendPilarElementDerivedValues(element)
        case 'viga':
            return appendVigaElementDerivedValues(element)
        case 'laje':
            return appendLajeElementDerivedValues(element)
        case 'outro':
            return element
        default:
            throw new Error(`Unknown element type: ${element.type}`)
    }
}

export const filterElementsAssignedToScope = (
    elements: QuoteElement[]
): QuoteElement[] => elements.filter((e) => e.scopeId != null)

// TODO: Update calculation to be correct based on spreadsheet
export const computeGastalhoCount = (elements: QuoteElement[]): number =>
    elements
        .filter((e) => e.type === 'pilar')
        .reduce((sum, e) => sum + normalizeNumber(e.values.quantidade), 0)

export const computeGarfoCount = (elements: QuoteElement[]): number =>
    elements
        .filter((e) => e.type === 'viga')
        .reduce((sum, e) => sum + normalizeNumber(e.values.quantidade), 0)

export const computeFundoAdicionalCount = (elements: QuoteElement[]): number =>
    elements
        .filter((e) => e.type === 'laje')
        .reduce((sum, e) => sum + normalizeNumber(e.values.quantidade), 0)

export const computeTiraAdicionalCount = (elements: QuoteElement[]): number =>
    elements
        .filter((e) => e.type === 'laje')
        .reduce((sum, e) => sum + normalizeNumber(e.values.quantidade), 0)
