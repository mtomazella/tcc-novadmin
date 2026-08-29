import {
  AlignmentType,
  BorderStyle,
  Footer,
  Header,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import {
  BLACK_COLOR,
  BODY_FONT_HALF_PT,
  CALLOUT_FONT_HALF_PT,
  CELL_NO_BORDERS,
  CONTENT_EFFECTIVE_WIDTH_MM,
  CONTENT_SIDE_PADDING_MM,
  LOGO_CELL_WIDTH_MM,
  MISSION_FONT_HALF_PT,
  MISSION_RIGHT_MARGIN_MM,
  MISSION_TOP_MARGIN_MM,
  ORANGE_COLOR,
  PAGE_NUMBER_FONT_HALF_PT,
  TABLE_NO_BORDERS,
  mmToTwip,
} from './constants'

export function buildDocumentHeader(quoteNumber: string): Header {
  return new Header({
    children: [
      // Table for mission text.
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: TABLE_NO_BORDERS,
        rows: [
          new TableRow({
            children: [
              // Spacer cell (mirrors logo cell width)
              new TableCell({
                width: {
                  size: mmToTwip(LOGO_CELL_WIDTH_MM),
                  type: WidthType.DXA,
                },
                borders: CELL_NO_BORDERS,
                children: [new Paragraph({ children: [] })],
              }),

              // Mission cell (top-right) — right-aligned, no border
              new TableCell({
                borders: CELL_NO_BORDERS,
                margins: {
                  right: mmToTwip(MISSION_RIGHT_MARGIN_MM),
                  top: mmToTwip(MISSION_TOP_MARGIN_MM),
                  left: mmToTwip(2),
                  bottom: mmToTwip(2),
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: quoteNumber,
                        bold: true,
                        size: MISSION_FONT_HALF_PT,
                        color: BLACK_COLOR,
                      }),
                    ],
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

export function buildDocumentFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        indent: { right: mmToTwip(CONTENT_SIDE_PADDING_MM) },
        children: [
          new TextRun({
            children: [PageNumber.CURRENT],
            size: PAGE_NUMBER_FONT_HALF_PT,
            color: BLACK_COLOR,
          }),
        ],
      }),
    ],
  })
}

// "Callout": orange-filled box spanning the full 15mm-padded content area.
export function buildCalloutTable(
  text: string,
  hasVerticalPadding = true,
): Table {
  const verticalCellMargin = hasVerticalPadding ? mmToTwip(1) : 0
  return new Table({
    width: { size: mmToTwip(CONTENT_EFFECTIVE_WIDTH_MM), type: WidthType.DXA },
    indent: { size: mmToTwip(CONTENT_SIDE_PADDING_MM), type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: BLACK_COLOR },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: BLACK_COLOR },
      left: { style: BorderStyle.SINGLE, size: 6, color: BLACK_COLOR },
      right: { style: BorderStyle.SINGLE, size: 6, color: BLACK_COLOR },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: {
              type: ShadingType.SOLID,
              fill: ORANGE_COLOR,
              color: ORANGE_COLOR,
            },
            margins: {
              top: verticalCellMargin,
              bottom: verticalCellMargin,
              left: mmToTwip(2),
              right: mmToTwip(2),
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text,
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

export interface DocxInfoRow {
  label: string
  value: string
  valueBold?: boolean
}

// Two-column info element: bold label column (32mm) + value column, indented 15mm from left.
export function buildInfoElementTable(rows: DocxInfoRow[]): Table {
  const LABEL_COL_WIDTH_MM = 32

  return new Table({
    width: { size: mmToTwip(CONTENT_EFFECTIVE_WIDTH_MM), type: WidthType.DXA },
    indent: { size: mmToTwip(CONTENT_SIDE_PADDING_MM), type: WidthType.DXA },
    borders: TABLE_NO_BORDERS,
    rows: rows.map(
      ({ label, value, valueBold }) =>
        new TableRow({
          children: [
            new TableCell({
              width: {
                size: mmToTwip(LABEL_COL_WIDTH_MM),
                type: WidthType.DXA,
              },
              borders: CELL_NO_BORDERS,
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
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: value || '—',
                      bold: valueBold,
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

// Small invisible paragraph used to create vertical spacing between block elements.
// Tables in docx cannot carry spacing.before/after, so we insert thin paragraphs.
export function spacerParagraph(beforeMm: number): Paragraph {
  return new Paragraph({
    spacing: { before: mmToTwip(beforeMm), after: 0 },
    children: [new TextRun({ text: '', size: 2 })],
  })
}
