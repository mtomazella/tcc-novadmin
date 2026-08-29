import {
  AlignmentType,
  ImageRun,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { DelimitacaoSection } from '@novadmin/lib/types'
import {
  BLACK_COLOR,
  BODY_FONT_HALF_PT,
  CELL_NO_BORDERS,
  CONTENT_EFFECTIVE_WIDTH_MM,
  CONTENT_SIDE_PADDING_MM,
  DARK_BORDER,
  LIGHT_ORANGE_COLOR,
  SECTION_TITLE_SPACING_NO_AFTER,
  SMALL_FONT_HALF_PT,
  TABLE_NO_BORDERS,
  TITLE_FONT_HALF_PT,
  mmToDocxPx,
  mmToTwip,
} from '../constants'
import { buildCalloutTable, spacerParagraph } from '../sharedBuilders'

// Two-row gray table with OBSERVAÇÕES/LEGENDA headers and section content.
// The orange callout is rendered separately via buildCalloutTable.
function buildLimitesDataTable(section: DelimitacaoSection): Table {
  const cellBorders = {
    top: DARK_BORDER,
    bottom: DARK_BORDER,
    left: DARK_BORDER,
    right: DARK_BORDER,
  }
  const CELL_MARGINS = {
    top: mmToTwip(1.5),
    bottom: mmToTwip(1.5),
    left: mmToTwip(2),
    right: mmToTwip(2),
  }
  const LEFT_COL_WIDTH = mmToTwip(Math.round(CONTENT_EFFECTIVE_WIDTH_MM * 0.65))

  const legendParagraphs: Paragraph[] =
    section.legendItems.length > 0
      ? section.legendItems.map(
          item =>
            new Paragraph({
              spacing: { after: mmToTwip(1) },
              children: [
                new TextRun({
                  text: '■ ',
                  color: item.color.replace('#', ''),
                  size: BODY_FONT_HALF_PT,
                }),
                new TextRun({
                  text: item.text,
                  size: SMALL_FONT_HALF_PT,
                  color: BLACK_COLOR,
                }),
              ],
            }),
        )
      : [new Paragraph({ children: [new TextRun({ text: '' })] })]

  return new Table({
    width: { size: mmToTwip(CONTENT_EFFECTIVE_WIDTH_MM), type: WidthType.DXA },
    indent: { size: mmToTwip(CONTENT_SIDE_PADDING_MM), type: WidthType.DXA },
    borders: TABLE_NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: LEFT_COL_WIDTH, type: WidthType.DXA },
            shading: {
              type: ShadingType.SOLID,
              fill: LIGHT_ORANGE_COLOR,
              color: LIGHT_ORANGE_COLOR,
            },
            margins: CELL_MARGINS,
            borders: cellBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'OBSERVAÇÕES',
                    bold: true,
                    size: BODY_FONT_HALF_PT,
                    color: BLACK_COLOR,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            shading: {
              type: ShadingType.SOLID,
              fill: LIGHT_ORANGE_COLOR,
              color: LIGHT_ORANGE_COLOR,
            },
            margins: CELL_MARGINS,
            borders: cellBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'LEGENDA',
                    bold: true,
                    size: BODY_FONT_HALF_PT,
                    color: BLACK_COLOR,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: LEFT_COL_WIDTH, type: WidthType.DXA },
            margins: CELL_MARGINS,
            borders: cellBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: section.observacoesText || '',
                    size: BODY_FONT_HALF_PT,
                    color: BLACK_COLOR,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            margins: CELL_MARGINS,
            borders: cellBorders,
            children: legendParagraphs,
          }),
        ],
      }),
    ],
  })
}

export async function buildDelimitacaoPageChildren(
  section: DelimitacaoSection,
  fileMap: Map<number, { data: Uint8Array; widthPx: number; heightPx: number }>,
): Promise<(Paragraph | Table)[]> {
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
        text: section.title || 'DELIMITAÇÃO',
        bold: true,
        size: TITLE_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
    ],
  })

  const limitsCallout = buildCalloutTable('LIMITES PREVISTOS PARA FORNECIMENTO')
  const limitsDataTable = buildLimitesDataTable(section)

  const imageParagraphs: Paragraph[] = []
  for (const fileId of section.selectedFileIds) {
    const fileData = fileMap.get(fileId)
    if (!fileData) continue
    const aspectRatio = fileData.widthPx / fileData.heightPx
    const imageWidthMm = CONTENT_EFFECTIVE_WIDTH_MM
    const imageHeightMm = imageWidthMm / aspectRatio
    imageParagraphs.push(
      new Paragraph({
        indent: { left: mmToTwip(CONTENT_SIDE_PADDING_MM) },
        spacing: { before: mmToTwip(4), after: 0 },
        children: [
          new ImageRun({
            data: fileData.data,
            transformation: {
              width: mmToDocxPx(imageWidthMm),
              height: mmToDocxPx(imageHeightMm),
            },
            type: 'jpg',
          }),
        ],
      }),
    )
  }

  return [
    titleParagraph,
    spacerParagraph(6),
    limitsCallout,
    limitsDataTable,
    spacerParagraph(4),
    ...imageParagraphs,
  ]
}
