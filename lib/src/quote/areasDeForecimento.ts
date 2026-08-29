import type { QuoteElement, QuoteScope } from '../types/index.js'
import {
    FUNDO_ADICIONAL_PRODUCT_ID,
    TIRA_ADICIONAL_PRODUCT_ID,
} from './constants.js'
import { getElementM2 } from './elements.js'

export interface AreasDeFornecimentoRow {
    label: string
    jogos: number
    m2: number | null
}

export interface AreasDeFornecimentoTableData {
    rows: AreasDeFornecimentoRow[]
    totalM2: number
}

function sumM2(elements: QuoteElement[]): number | null {
    const total = elements.reduce(
        (accumulator, element) => accumulator + getElementM2(element),
        0
    )
    return total === 0 ? null : total
}

export function computeAreasDeForecimentoTable(
    elements: QuoteElement[]
): AreasDeFornecimentoTableData {
    const pilarM2 = sumM2(
        elements.filter((element) => element.type === 'pilar')
    )
    const vigaM2 = sumM2(elements.filter((element) => element.type === 'viga'))
    const fundoAdicionalM2 = sumM2(
        elements.filter(
            (element) =>
                element.type === 'outro' &&
                element.productId === FUNDO_ADICIONAL_PRODUCT_ID
        )
    )
    const lajeM2 = sumM2(elements.filter((element) => element.type === 'laje'))
    const tiraAdicionalM2 = sumM2(
        elements.filter(
            (element) =>
                element.type === 'outro' &&
                element.productId === TIRA_ADICIONAL_PRODUCT_ID
        )
    )

    const rows: AreasDeFornecimentoRow[] = [
        { label: 'Pilar', jogos: 0, m2: pilarM2 },
        { label: 'Viga', jogos: 0, m2: vigaM2 },
        { label: 'Fundo adicional de viga', jogos: 0, m2: fundoAdicionalM2 },
        { label: 'Laje', jogos: 0, m2: lajeM2 },
        {
            label: 'Tira de reescoramento adicional',
            jogos: 0,
            m2: tiraAdicionalM2,
        },
    ]

    const totalM2 = rows.reduce(
        (accumulator, row) => accumulator + (row.m2 ?? 0),
        0
    )

    return { rows, totalM2 }
}

export function deriveEspFromScope(scope: QuoteScope): string {
    const chapaSelection = scope.materialSelections.find(
        (selection) => selection.materialType === 'chapa'
    )
    if (!chapaSelection) return ''
    const snapshot = scope.materials[String(chapaSelection.materialId)]
    if (!snapshot) return ''
    return snapshot.name.split(' - ')[0].trim()
}
