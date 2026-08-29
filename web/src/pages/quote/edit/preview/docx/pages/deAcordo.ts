import {
  AlignmentType,
  BorderStyle,
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
  CELL_NO_BORDERS,
  CONTENT_EFFECTIVE_WIDTH_MM,
  CONTENT_SIDE_PADDING_MM,
  DARK_BORDER,
  DARK_COLOR,
  GRAY_FILL_COLOR,
  TABLE_NO_BORDERS,
  TITLE_FONT_HALF_PT,
  mmToTwip,
} from '../constants'
import { buildCalloutTable, spacerParagraph } from '../sharedBuilders'

const NO_TOP_DARK_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: DARK_BORDER,
  left: DARK_BORDER,
  right: DARK_BORDER,
}

function buildSignatureLine(): Paragraph {
  return new Paragraph({
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 4,
        color: DARK_COLOR,
        space: 1,
      },
    },
    spacing: { after: mmToTwip(2) },
    children: [new TextRun({ text: ' ', size: BODY_FONT_HALF_PT })],
  })
}

function buildSignatureBox(): Table {
  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: CELL_NO_BORDERS,
            margins: { top: 0, bottom: 0, left: 0, right: mmToTwip(4) },
            children: [
              buildSignatureLine(),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: 'Nome Completo',
                    bold: true,
                    size: BODY_FONT_HALF_PT,
                    color: BLACK_COLOR,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: 'Diretor Geral',
                    size: BODY_FONT_HALF_PT,
                    color: BLACK_COLOR,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: CELL_NO_BORDERS,
            margins: { top: 0, bottom: 0, left: mmToTwip(4), right: 0 },
            children: [
              buildSignatureLine(),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: 'Nome Completo',
                    bold: true,
                    size: BODY_FONT_HALF_PT,
                    color: BLACK_COLOR,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: 'Diretor Comercial',
                    size: BODY_FONT_HALF_PT,
                    color: BLACK_COLOR,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: 'Tel. (00) 00000-0000',
                    size: BODY_FONT_HALF_PT,
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

  return new Table({
    width: { size: mmToTwip(CONTENT_EFFECTIVE_WIDTH_MM), type: WidthType.DXA },
    indent: { size: mmToTwip(CONTENT_SIDE_PADDING_MM), type: WidthType.DXA },
    borders: TABLE_NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: NO_TOP_DARK_BORDERS,
            margins: {
              top: mmToTwip(3),
              bottom: mmToTwip(3),
              left: mmToTwip(3),
              right: mmToTwip(3),
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: 'Atenciosamente, de acordo:',
                    size: BODY_FONT_HALF_PT,
                    color: BLACK_COLOR,
                  }),
                ],
              }),
              spacerParagraph(20),
              signatureTable,
            ],
          }),
        ],
      }),
    ],
  })
}

function buildInputBox(): Table {
  const inputRow = (label: string): TableRow =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: mmToTwip(30), type: WidthType.DXA },
          borders: CELL_NO_BORDERS,
          margins: {
            top: mmToTwip(3),
            bottom: mmToTwip(3),
            left: mmToTwip(3),
            right: mmToTwip(3),
          },
          children: [
            new Paragraph({
              spacing: { after: 0 },
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
          shading: {
            type: ShadingType.SOLID,
            fill: GRAY_FILL_COLOR,
            color: GRAY_FILL_COLOR,
          },
          margins: {
            top: mmToTwip(3),
            bottom: mmToTwip(3),
            left: mmToTwip(3),
            right: mmToTwip(3),
          },
          children: [
            new Paragraph({
              spacing: { after: 0 },
              children: [new TextRun({ text: ' ', size: BODY_FONT_HALF_PT })],
            }),
          ],
        }),
      ],
    })

  const innerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_NO_BORDERS,
    rows: [inputRow('DE ACORDO:'), inputRow('NOME:'), inputRow('CPF:')],
  })

  const saoPauloParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: mmToTwip(5), after: mmToTwip(5) },
    children: [
      new TextRun({
        text: 'São Paulo, __________ de ________________________ de 2026.',
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
    ],
  })

  return new Table({
    width: { size: mmToTwip(CONTENT_EFFECTIVE_WIDTH_MM), type: WidthType.DXA },
    indent: { size: mmToTwip(CONTENT_SIDE_PADDING_MM), type: WidthType.DXA },
    borders: TABLE_NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: NO_TOP_DARK_BORDERS,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [innerTable, saoPauloParagraph],
          }),
        ],
      }),
    ],
  })
}

export function buildDeAcordoChildren(): (Paragraph | Table)[] {
  const titleParagraph = new Paragraph({
    pageBreakBefore: true,
    alignment: AlignmentType.CENTER,
    indent: {
      left: mmToTwip(CONTENT_SIDE_PADDING_MM),
      right: mmToTwip(CONTENT_SIDE_PADDING_MM),
    },
    spacing: { before: mmToTwip(15), after: mmToTwip(6) },
    children: [
      new TextRun({
        text: 'DE ACORDO',
        bold: true,
        size: TITLE_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
    ],
  })

  return [
    titleParagraph,
    buildCalloutTable('EMPRESA EXEMPLO'),
    buildSignatureBox(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      indent: {
        left: mmToTwip(CONTENT_SIDE_PADDING_MM),
        right: mmToTwip(CONTENT_SIDE_PADDING_MM),
      },
      spacing: { before: mmToTwip(3), after: mmToTwip(3) },
      children: [
        new TextRun({
          text: 'Favor devolver documento com campo abaixo preenchido:',
          size: BODY_FONT_HALF_PT,
          color: BLACK_COLOR,
        }),
      ],
    }),
    buildCalloutTable('CONTRATANTE'),
    buildInputBox(),
  ]
}
