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
import type {
  AreaOrderGroup,
  QuoteElement,
  QuoteScope,
} from '@novadmin/lib/types'
import { areasDeForecimento as areasDeForecimentoLib } from '@novadmin/lib/quote'
import {
  ALL_DARK_BORDERS,
  BLACK_COLOR,
  BODY_FONT_HALF_PT,
  CONTENT_EFFECTIVE_WIDTH_MM,
  CONTENT_SIDE_PADDING_MM,
  LIGHT_ORANGE_COLOR,
  ORANGE_COLOR,
  TABLE_NO_BORDERS,
  TITLE_FONT_HALF_PT,
  mmToTwip,
} from '../constants'
import { buildCalloutTable, spacerParagraph } from '../sharedBuilders'

const CELL_MARGINS = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
}

const DATA_CELL_BORDERS = ALL_DARK_BORDERS

const RIGHT_COLUMN_WIDTH_MM = 35

function buildOrangeCell(
  text: string,
  alignment: AlignmentType = AlignmentType.CENTER,
  columnSpan?: number,
  fillColor: string = ORANGE_COLOR,
): TableCell {
  return new TableCell({
    ...(columnSpan !== undefined ? { columnSpan } : {}),
    shading: {
      type: ShadingType.SOLID,
      fill: fillColor,
      color: fillColor,
    },
    borders: DATA_CELL_BORDERS,
    margins: CELL_MARGINS,
    children: [
      new Paragraph({
        alignment,
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
  })
}

function buildDataCellLeft(prefix: string, scopeName: string): TableCell {
  return new TableCell({
    borders: DATA_CELL_BORDERS,
    margins: CELL_MARGINS,
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: prefix,
            size: BODY_FONT_HALF_PT,
            color: BLACK_COLOR,
          }),
          new TextRun({
            text: scopeName,
            bold: true,
            size: BODY_FONT_HALF_PT,
            color: BLACK_COLOR,
          }),
        ],
      }),
    ],
  })
}

function buildDataCellRight(text: string): TableCell {
  return new TableCell({
    width: { size: mmToTwip(RIGHT_COLUMN_WIDTH_MM), type: WidthType.DXA },
    borders: DATA_CELL_BORDERS,
    margins: CELL_MARGINS,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text, size: BODY_FONT_HALF_PT, color: BLACK_COLOR }),
        ],
      }),
    ],
  })
}

export function buildMetragensChildren(
  groups: AreaOrderGroup[],
  scopeMap: Map<number, QuoteScope>,
  derivedElementsByScope: Map<number, QuoteElement[]>,
): (Paragraph | Table)[] {
  const totalM2 = groups
    .flatMap(group => group.scopeIds)
    .reduce((sum, scopeId) => {
      const scopeElements = derivedElementsByScope.get(scopeId) ?? []
      return (
        sum +
        areasDeForecimentoLib.computeAreasDeForecimentoTable(scopeElements)
          .totalM2
      )
    }, 0)

  const tableRows: TableRow[] = [
    new TableRow({
      children: [
        buildOrangeCell('PAVIMENTOS', AlignmentType.CENTER),
        buildOrangeCell('METRAGENS (m²)', AlignmentType.CENTER),
      ],
    }),
  ]

  for (const group of groups) {
    tableRows.push(
      new TableRow({
        children: [
          buildOrangeCell(
            group.name,
            AlignmentType.CENTER,
            2,
            LIGHT_ORANGE_COLOR,
          ),
        ],
      }),
    )

    for (const [indexInGroup, scopeId] of group.scopeIds.entries()) {
      const scope = scopeMap.get(scopeId)
      if (!scope) continue
      const scopeM2 = areasDeForecimentoLib.computeAreasDeForecimentoTable(
        derivedElementsByScope.get(scopeId) ?? [],
      ).totalM2
      const labelPrefix =
        indexInGroup === 0
          ? 'Fornecimento para '
          : 'Fornecimento complementar para '
      tableRows.push(
        new TableRow({
          children: [
            buildDataCellLeft(labelPrefix, scope.name),
            buildDataCellRight(scopeM2.toFixed(2)),
          ],
        }),
      )
    }
  }

  tableRows.push(
    new TableRow({
      children: [
        buildOrangeCell('METRAGEM TOTAL', AlignmentType.LEFT),
        buildOrangeCell(totalM2.toFixed(2), AlignmentType.CENTER),
      ],
    }),
  )

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
          text: 'METRAGENS',
          bold: true,
          size: TITLE_FONT_HALF_PT,
          color: BLACK_COLOR,
        }),
      ],
    }),
    buildCalloutTable('RESUMO DE ÁREAS'),
    spacerParagraph(4),
    new Paragraph({
      indent: {
        left: mmToTwip(CONTENT_SIDE_PADDING_MM),
        right: mmToTwip(CONTENT_SIDE_PADDING_MM),
      },
      spacing: { before: 0, after: mmToTwip(4) },
      children: [
        new TextRun({
          text: 'Abaixo resumo das áreas previstas em orçamento:',
          size: BODY_FONT_HALF_PT,
          color: BLACK_COLOR,
        }),
      ],
    }),
    new Table({
      width: {
        size: mmToTwip(CONTENT_EFFECTIVE_WIDTH_MM),
        type: WidthType.DXA,
      },
      indent: {
        size: mmToTwip(CONTENT_SIDE_PADDING_MM),
        type: WidthType.DXA,
      },
      borders: TABLE_NO_BORDERS,
      rows: tableRows,
    }),
  ]
}
