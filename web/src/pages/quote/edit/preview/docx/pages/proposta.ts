import {
  AlignmentType,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import {
  computedElements as computedElementsLib,
  costSummary as costSummaryLib,
  elements as elementsLib,
  groupedElements as groupedElementsLib,
} from '@novadmin/lib/quote'
import {
  formatCurrency,
  toLocalDecimal,
} from '@novadmin/lib/utils/unitConversion'
import {
  ALL_DARK_BORDERS,
  BLACK_COLOR,
  BODY_FONT_HALF_PT,
  CALLOUT_FONT_HALF_PT,
  CONTENT_EFFECTIVE_WIDTH_MM,
  CONTENT_SIDE_PADDING_MM,
  LIGHT_ORANGE_COLOR,
  ORANGE_COLOR,
  SMALL_FONT_HALF_PT,
  TABLE_CELL_MARGINS_SM,
  TABLE_NO_BORDERS,
  TITLE_FONT_HALF_PT,
  mmToTwip,
  type DocxDocumentData,
} from '../constants'
import { buildCalloutTable, spacerParagraph } from '../sharedBuilders'

const ORIGEM_COL_MM = 62
const QUANTITY_COL_MM = 25
const X_COL_MM = 10
const UNIT_VALUE_COL_MM = 30
const ELEMENT_VALUE_COL_MM =
  CONTENT_EFFECTIVE_WIDTH_MM -
  ORIGEM_COL_MM -
  QUANTITY_COL_MM -
  X_COL_MM -
  UNIT_VALUE_COL_MM // = 29mm

function buildOrangeSpanningRow(text: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 5,
        shading: {
          type: ShadingType.SOLID,
          fill: ORANGE_COLOR,
          color: ORANGE_COLOR,
        },
        borders: ALL_DARK_BORDERS,
        margins: TABLE_CELL_MARGINS_SM,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text,
                bold: true,
                size: BODY_FONT_HALF_PT,
                color: BLACK_COLOR,
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

function buildColumnHeaderRow(col2Label: string, col4Label: string): TableRow {
  const headerCellShading = {
    type: ShadingType.SOLID,
    fill: LIGHT_ORANGE_COLOR,
    color: LIGHT_ORANGE_COLOR,
  }
  const makeHeaderCell = (text: string, widthMm: number) =>
    new TableCell({
      shading: headerCellShading,
      borders: ALL_DARK_BORDERS,
      margins: TABLE_CELL_MARGINS_SM,
      width: { size: mmToTwip(widthMm), type: WidthType.DXA },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text,
              bold: true,
              size: SMALL_FONT_HALF_PT,
              color: BLACK_COLOR,
            }),
          ],
        }),
      ],
    })

  return new TableRow({
    children: [
      makeHeaderCell('ORIGEM', ORIGEM_COL_MM),
      makeHeaderCell(col2Label, QUANTITY_COL_MM),
      makeHeaderCell('X', X_COL_MM),
      makeHeaderCell(col4Label, UNIT_VALUE_COL_MM),
      makeHeaderCell('VALOR POR ELEMENTO', ELEMENT_VALUE_COL_MM),
    ],
  })
}

function buildDataRow(
  origemText: string,
  quantityText: string,
  unitValueCents: number,
  totalCents: number,
): TableRow {
  const makeCell = (
    text: string,
    widthMm: number,
    alignment = AlignmentType.LEFT,
  ) =>
    new TableCell({
      borders: ALL_DARK_BORDERS,
      margins: TABLE_CELL_MARGINS_SM,
      width: { size: mmToTwip(widthMm), type: WidthType.DXA },
      children: [
        new Paragraph({
          alignment,
          children: [
            new TextRun({ text, size: SMALL_FONT_HALF_PT, color: BLACK_COLOR }),
          ],
        }),
      ],
    })

  return new TableRow({
    children: [
      makeCell(origemText, ORIGEM_COL_MM),
      makeCell(quantityText, QUANTITY_COL_MM, AlignmentType.CENTER),
      makeCell('X', X_COL_MM, AlignmentType.CENTER),
      makeCell(
        formatCurrency(unitValueCents),
        UNIT_VALUE_COL_MM,
        AlignmentType.CENTER,
      ),
      makeCell(
        formatCurrency(totalCents),
        ELEMENT_VALUE_COL_MM,
        AlignmentType.CENTER,
      ),
    ],
  })
}

function buildFooterRow(totalCents: number): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 4,
        shading: {
          type: ShadingType.SOLID,
          fill: ORANGE_COLOR,
          color: ORANGE_COLOR,
        },
        borders: ALL_DARK_BORDERS,
        margins: TABLE_CELL_MARGINS_SM,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'VALOR TOTAL',
                bold: true,
                size: SMALL_FONT_HALF_PT,
                color: BLACK_COLOR,
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        shading: {
          type: ShadingType.SOLID,
          fill: ORANGE_COLOR,
          color: ORANGE_COLOR,
        },
        borders: ALL_DARK_BORDERS,
        margins: TABLE_CELL_MARGINS_SM,
        width: { size: mmToTwip(ELEMENT_VALUE_COL_MM), type: WidthType.DXA },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: formatCurrency(totalCents),
                bold: true,
                size: SMALL_FONT_HALF_PT,
                color: BLACK_COLOR,
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

function buildPricingTable(
  headerText: string,
  col2Label: string,
  col4Label: string,
  rows: Array<{
    origemText: string
    quantityText: string
    unitValueCents: number
    totalCents: number
  }>,
  totalCents: number,
): Table {
  return new Table({
    width: { size: mmToTwip(CONTENT_EFFECTIVE_WIDTH_MM), type: WidthType.DXA },
    indent: { size: mmToTwip(CONTENT_SIDE_PADDING_MM), type: WidthType.DXA },
    rows: [
      buildOrangeSpanningRow(headerText),
      buildColumnHeaderRow(col2Label, col4Label),
      ...rows.map(row =>
        buildDataRow(
          row.origemText,
          row.quantityText,
          row.unitValueCents,
          row.totalCents,
        ),
      ),
      buildFooterRow(totalCents),
    ],
  })
}

function buildLeadParagraph(text: string): Paragraph {
  return new Paragraph({
    indent: {
      left: mmToTwip(CONTENT_SIDE_PADDING_MM),
      right: mmToTwip(CONTENT_SIDE_PADDING_MM),
    },
    spacing: { before: 0, after: mmToTwip(3) },
    children: [
      new TextRun({ text, size: SMALL_FONT_HALF_PT, color: BLACK_COLOR }),
    ],
  })
}

function buildGrandTotalTable(grandTotalCents: number): Table {
  const leftCellWidthMm = 80
  const rightCellWidthMm = CONTENT_EFFECTIVE_WIDTH_MM - leftCellWidthMm

  return new Table({
    width: { size: mmToTwip(CONTENT_EFFECTIVE_WIDTH_MM), type: WidthType.DXA },
    indent: { size: mmToTwip(CONTENT_SIDE_PADDING_MM), type: WidthType.DXA },
    borders: TABLE_NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: mmToTwip(leftCellWidthMm), type: WidthType.DXA },
            shading: {
              type: ShadingType.SOLID,
              fill: 'FFFFFF',
              color: 'FFFFFF',
            },
            borders: ALL_DARK_BORDERS,
            margins: TABLE_CELL_MARGINS_SM,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'VALOR TOTAL PROPOSTA:',
                    bold: true,
                    size: BODY_FONT_HALF_PT,
                    color: BLACK_COLOR,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: mmToTwip(rightCellWidthMm), type: WidthType.DXA },
            shading: {
              type: ShadingType.SOLID,
              fill: ORANGE_COLOR,
              color: ORANGE_COLOR,
            },
            borders: ALL_DARK_BORDERS,
            margins: TABLE_CELL_MARGINS_SM,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: formatCurrency(grandTotalCents),
                    bold: true,
                    size: CALLOUT_FONT_HALF_PT,
                    color: BLACK_COLOR,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

export function buildPropostaChildren(
  data: DocxDocumentData,
): (Paragraph | Table)[] {
  // Exclude elements with no scope — they're not part of any priced area.
  // Matches ValuesTab.tsx's allQuoteElements, which applies the same filter.
  const scopedElements = elementsLib.filterElementsAssignedToScope(
    data.scopeElements,
  )
  const derivedElements = scopedElements.map(
    elementsLib.appendElementDerivedValues,
  )
  const allDerivedElements = [
    ...derivedElements,
    ...computedElementsLib.generateComputedElements(
      derivedElements,
      data.scopes,
    ),
  ]

  // Piece counts are only needed to split the garfo row by tipo for display;
  // all monetary totals below come from computeCostSummary, the same
  // function the Values tab uses, so the two never diverge.
  const garfoCounts = computedElementsLib.computeGarfoPieceCounts(
    allDerivedElements,
    data.scopes,
  )

  const elementGroups =
    groupedElementsLib.elementsToGroupedElements(allDerivedElements)
  const costSummary = costSummaryLib.computeCostSummary({
    elementGroups,
    effectiveFixedCosts: [],
    selectedPricingOption: data.selectedPricingOption ?? undefined,
  })
  const { totalM2Reto, totalM2Cambotado } = costSummary

  const valueReto = data.selectedPricingOption?.valueReto ?? 0
  const valueCambotado = data.selectedPricingOption?.valueCambotado ?? 0
  const valueGarfo = data.selectedPricingOption?.valueGarfo ?? 0

  const retoCents = costSummary.pricingTotalReto
  const cambotadoCents = costSummary.pricingTotalCambotado
  const formsTotalCents = retoCents + cambotadoCents

  // costSummary.pricingTotalGarfo depends on the garfo product's modifier
  // flag, which requires that product to be present in the quote's product
  // snapshot. The borda/interno rows above don't have that dependency (they
  // key off productId directly), so the total must be summed from those
  // already-displayed values to stay internally consistent even when the
  // snapshot is incomplete.
  const bordaTotalCents = Math.round(garfoCounts.bordaCount * valueGarfo)
  const internoTotalCents = Math.round(garfoCounts.internoCount * valueGarfo)
  const garfoTotalCents = bordaTotalCents + internoTotalCents

  const grandTotalCents = formsTotalCents + garfoTotalCents

  return [
    new Paragraph({
      pageBreakBefore: true,
      alignment: AlignmentType.CENTER,
      indent: {
        left: mmToTwip(CONTENT_SIDE_PADDING_MM),
        right: mmToTwip(CONTENT_SIDE_PADDING_MM),
      },
      spacing: { before: mmToTwip(10), after: mmToTwip(4) },
      children: [
        new TextRun({
          text: 'PROPOSTA',
          bold: true,
          size: TITLE_FONT_HALF_PT,
          color: BLACK_COLOR,
        }),
      ],
    }),

    buildCalloutTable('DESCRITIVO DOS VALORES CONTRATADOS'),
    spacerParagraph(3),

    buildLeadParagraph(
      'A seguir valores considerados para precificação das formas:',
    ),

    buildPricingTable(
      'FORNECIMENTO PARA FÔRMAS',
      'M²',
      'VALOR (m²)',
      [
        {
          origemText: 'Valor metro quadrado (reto)',
          quantityText: `${toLocalDecimal(totalM2Reto, 2)} m²`,
          unitValueCents: valueReto,
          totalCents: retoCents,
        },
        {
          origemText: 'Valor metro cambotado (curvo)',
          quantityText: `${toLocalDecimal(totalM2Cambotado, 2)} m²`,
          unitValueCents: valueCambotado,
          totalCents: cambotadoCents,
        },
      ],
      formsTotalCents,
    ),
    spacerParagraph(4),

    buildLeadParagraph(
      'A seguir valores considerados para precificação dos garfos:',
    ),

    buildPricingTable(
      'FORNECIMENTO PARA GARFOS',
      'QUANT.',
      'VALOR (peças)',
      [
        {
          origemText: 'Garfos para vigas de borda',
          quantityText: `${String(garfoCounts.bordaCount).padStart(
            2,
            '0',
          )} pçs`,
          unitValueCents: valueGarfo,
          totalCents: bordaTotalCents,
        },
        {
          origemText: 'Garfos para vigas internas',
          quantityText: `${String(garfoCounts.internoCount).padStart(
            2,
            '0',
          )} pçs`,
          unitValueCents: valueGarfo,
          totalCents: internoTotalCents,
        },
      ],
      garfoTotalCents,
    ),
    spacerParagraph(4),

    buildLeadParagraph('Somando os valores finais apresentados, temos:'),

    buildGrandTotalTable(grandTotalCents),
    spacerParagraph(6),

    new Paragraph({
      alignment: AlignmentType.DISTRIBUTE,
      indent: {
        left: mmToTwip(CONTENT_SIDE_PADDING_MM),
        right: mmToTwip(CONTENT_SIDE_PADDING_MM),
      },
      spacing: { before: 0, after: mmToTwip(6) },
      children: [
        new TextRun({
          text: 'Quaisquer revisões nos projetos mencionados deverão ser ',
          bold: true,
          size: SMALL_FONT_HALF_PT,
          color: BLACK_COLOR,
        }),
        new TextRun({
          text: 'formalizadas e aprovadas por escrito, mediante concordância expressa de ambas as partes.',
          bold: true,
          size: SMALL_FONT_HALF_PT,
          color: ORANGE_COLOR,
        }),
      ],
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      indent: {
        left: mmToTwip(CONTENT_SIDE_PADDING_MM),
        right: mmToTwip(CONTENT_SIDE_PADDING_MM),
      },
      spacing: { before: 0, after: 0 },
      children: [
        new TextRun({
          text: 'PRAZO DE ENTREGA: 40 A 50 DIAS APÓS O FECHAMENTO.',
          bold: true,
          size: SMALL_FONT_HALF_PT,
          color: BLACK_COLOR,
        }),
      ],
    }),
  ]
}
