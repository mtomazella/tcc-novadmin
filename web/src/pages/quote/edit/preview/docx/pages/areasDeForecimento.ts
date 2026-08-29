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
import type { QuoteElement, QuoteScope } from '@novadmin/lib/types'
import { areasDeForecimento as areasDeForecimentoLib } from '@novadmin/lib/quote'
import {
  BLACK_COLOR,
  BODY_FONT_HALF_PT,
  CELL_NO_BORDERS,
  CONTENT_EFFECTIVE_WIDTH_MM,
  CONTENT_SIDE_PADDING_MM,
  ORANGE_COLOR,
  SECTION_TITLE_SPACING_NO_AFTER,
  TABLE_CELL_MARGINS_SM,
  TABLE_NO_BORDERS,
  TITLE_FONT_HALF_PT,
  mmToTwip,
} from '../constants'
import { buildCalloutTable, spacerParagraph } from '../sharedBuilders'
import { htmlToParagraphs } from '../htmlParser'

const { computeAreasDeForecimentoTable, deriveEspFromScope } =
  areasDeForecimentoLib

interface AreasDeFornecimentoScopeOverrides {
  cs?: string
  cc?: string
  pd?: string
  esp?: string
  material?: string
  consideracoes?: string
}

const INFO_TABLE_SPLIT_LEFT_MM = Math.round(CONTENT_EFFECTIVE_WIDTH_MM * 0.55)
const INFO_TABLE_SPLIT_RIGHT_MM =
  CONTENT_EFFECTIVE_WIDTH_MM - INFO_TABLE_SPLIT_LEFT_MM

// Two-column info table (bold label | value) — no background color.
function buildInfoTable(
  rows: Array<{ label: string; value: string }>,
  labelColMm: number,
  tableWidthMm: number,
): Table {
  return new Table({
    width: { size: mmToTwip(tableWidthMm), type: WidthType.DXA },
    borders: TABLE_NO_BORDERS,
    rows: rows.map(
      ({ label, value }) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: mmToTwip(labelColMm), type: WidthType.DXA },
              borders: CELL_NO_BORDERS,
              margins: TABLE_CELL_MARGINS_SM,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label,
                      bold: true,
                      size: BODY_FONT_HALF_PT,
                      color: BLACK_COLOR,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: CELL_NO_BORDERS,
              margins: TABLE_CELL_MARGINS_SM,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: value || '—',
                      size: BODY_FONT_HALF_PT,
                      color: BLACK_COLOR,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
    ),
  })
}

// Outer wrapper table with two inner tables side by side.
function buildSideBySideInfoTables(
  leftRows: Array<{ label: string; value: string }>,
  rightRows: Array<{ label: string; value: string }>,
): Table {
  const leftTable = buildInfoTable(leftRows, 40, INFO_TABLE_SPLIT_LEFT_MM)
  const rightTable = buildInfoTable(rightRows, 18, INFO_TABLE_SPLIT_RIGHT_MM)

  return new Table({
    width: { size: mmToTwip(CONTENT_EFFECTIVE_WIDTH_MM), type: WidthType.DXA },
    indent: { size: mmToTwip(CONTENT_SIDE_PADDING_MM), type: WidthType.DXA },
    borders: TABLE_NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: {
              size: mmToTwip(INFO_TABLE_SPLIT_LEFT_MM),
              type: WidthType.DXA,
            },
            borders: CELL_NO_BORDERS,
            children: [leftTable],
          }),
          new TableCell({
            borders: CELL_NO_BORDERS,
            children: [rightTable],
          }),
        ],
      }),
    ],
  })
}

// Three-column elements table: orange header row, data rows, orange footer row.
function buildElementsTable(
  tableData: ReturnType<typeof computeAreasDeForecimentoTable>,
  materialHeader: string,
): Table {
  const orangeCell = (
    text: string,
    textAlign: 'left' | 'right' | 'center' = 'left',
  ) =>
    new TableCell({
      shading: {
        type: ShadingType.SOLID,
        fill: ORANGE_COLOR,
        color: ORANGE_COLOR,
      },
      borders: CELL_NO_BORDERS,
      margins: TABLE_CELL_MARGINS_SM,
      children: [
        new Paragraph({
          alignment:
            textAlign === 'center'
              ? AlignmentType.CENTER
              : textAlign === 'right'
              ? AlignmentType.RIGHT
              : AlignmentType.LEFT,
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

  const dataCell = (
    text: string,
    textAlign: 'left' | 'right' | 'center' = 'left',
  ) =>
    new TableCell({
      borders: CELL_NO_BORDERS,
      margins: TABLE_CELL_MARGINS_SM,
      children: [
        new Paragraph({
          alignment:
            textAlign === 'center'
              ? AlignmentType.CENTER
              : textAlign === 'right'
              ? AlignmentType.RIGHT
              : AlignmentType.LEFT,
          children: [
            new TextRun({
              text,
              size: BODY_FONT_HALF_PT,
              color: BLACK_COLOR,
            }),
          ],
        }),
      ],
    })

  return new Table({
    width: { size: mmToTwip(CONTENT_EFFECTIVE_WIDTH_MM), type: WidthType.DXA },
    indent: { size: mmToTwip(CONTENT_SIDE_PADDING_MM), type: WidthType.DXA },
    borders: TABLE_NO_BORDERS,
    rows: [
      // Header row
      new TableRow({
        children: [
          orangeCell('ELEMENTOS'),
          orangeCell('JOGOS', 'center'),
          orangeCell(materialHeader, 'center'),
        ],
      }),
      // Data rows
      ...tableData.rows.map(
        row =>
          new TableRow({
            children: [
              dataCell(row.label),
              dataCell(row.jogos > 0 ? String(row.jogos) : '—', 'center'),
              dataCell(row.m2 !== null ? row.m2.toFixed(2) : '—', 'right'),
            ],
          }),
      ),
      // Footer row
      new TableRow({
        children: [
          orangeCell('ÁREA TOTAL:'),
          orangeCell(''),
          orangeCell(tableData.totalM2.toFixed(2), 'right'),
        ],
      }),
    ],
  })
}

export function buildAreasDeForecimentoPageChildren(
  scope: QuoteScope,
  scopePageElements: QuoteElement[],
  overrides: AreasDeFornecimentoScopeOverrides,
  calloutText: string,
): (Paragraph | Table)[] {
  const tableData = computeAreasDeForecimentoTable(scopePageElements)
  const effectivePd = overrides.pd ?? scope.ceilingHeight ?? ''
  const effectiveEsp = overrides.esp ?? deriveEspFromScope(scope)
  const effectiveMaterial = overrides.material ?? 'Plastificado'
  const effectiveConsideracoes = overrides.consideracoes ?? ''
  const materialHeader = `${effectiveMaterial.toUpperCase()} (m²)`

  const titleParagraph = new Paragraph({
    pageBreakBefore: true,
    alignment: AlignmentType.CENTER,
    indent: {
      left: mmToTwip(CONTENT_SIDE_PADDING_MM),
      right: mmToTwip(CONTENT_SIDE_PADDING_MM),
    },
    spacing: SECTION_TITLE_SPACING_NO_AFTER,
    children: [
      new TextRun({
        text: 'ÁREAS DE FORNECIMENTO',
        bold: true,
        size: TITLE_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
    ],
  })

  const jogoCallout = buildCalloutTable(calloutText)

  const infoTable = buildSideBySideInfoTables(
    [
      { label: 'Fornecimento para:', value: scope.name },
      { label: 'Projeto Referência:', value: scope.projectFileName ?? '' },
      { label: 'Delimitação:', value: scope.boundary ?? '' },
      { label: 'Material:', value: effectiveMaterial },
    ],
    [
      { label: 'CS.:', value: overrides.cs ?? '' },
      { label: 'CC.:', value: overrides.cc ?? '' },
      { label: 'PD.:', value: effectivePd },
      { label: 'ESP.:', value: effectiveEsp },
    ],
  )

  const italicParagraph = new Paragraph({
    indent: {
      left: mmToTwip(CONTENT_SIDE_PADDING_MM),
      right: mmToTwip(CONTENT_SIDE_PADDING_MM),
    },
    spacing: { before: mmToTwip(4), after: mmToTwip(4) },
    children: [
      new TextRun({
        text: 'A seguir estão as metragens estimadas para os elementos deste pavimento:',
        italics: true,
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
    ],
  })

  const elementsTable = buildElementsTable(tableData, materialHeader)

  const consideracoesCallout = buildCalloutTable('CONSIDERAÇÕES')

  const consideracoesParagraphs: Paragraph[] = effectiveConsideracoes.trim()
    ? htmlToParagraphs(effectiveConsideracoes)
    : [
        new Paragraph({
          indent: {
            left: mmToTwip(CONTENT_SIDE_PADDING_MM),
            right: mmToTwip(CONTENT_SIDE_PADDING_MM),
          },
          children: [new TextRun({ text: '', size: BODY_FONT_HALF_PT })],
        }),
      ]

  return [
    titleParagraph,
    spacerParagraph(4),
    jogoCallout,
    spacerParagraph(4),
    infoTable,
    italicParagraph,
    elementsTable,
    spacerParagraph(4),
    consideracoesCallout,
    spacerParagraph(4),
    ...consideracoesParagraphs,
  ]
}
