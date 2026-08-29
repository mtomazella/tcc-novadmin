import {
  AlignmentType,
  Paragraph,
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
  TABLE_CELL_MARGINS_SM,
  TABLE_NO_BORDERS,
  TITLE_FONT_HALF_PT,
  mmToTwip,
  type DocxDocumentData,
} from '../constants'
import { buildCalloutTable, spacerParagraph } from '../sharedBuilders'

interface HistoricoDocxRow {
  label: string
  value: string
  valueBold?: boolean
}

// Two-column gray table used for revision rows and responsáveis rows.
function buildHistoricoDataTable(
  rows: HistoricoDocxRow[],
  labelColMm: number,
): Table {
  return new Table({
    width: { size: mmToTwip(CONTENT_EFFECTIVE_WIDTH_MM), type: WidthType.DXA },
    indent: { size: mmToTwip(CONTENT_SIDE_PADDING_MM), type: WidthType.DXA },
    borders: TABLE_NO_BORDERS,
    rows: rows.map(
      ({ label, value, valueBold }) =>
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

export function buildHistoricoChildren(
  data: DocxDocumentData,
): (Paragraph | Table)[] {
  const revisions =
    (data.documentOptions.revisions as
      | Array<{ label: string; description: string }>
      | undefined) ?? []
  const orcamentista = (data.documentOptions.orcamentista as string) || ''
  const revisor = (data.documentOptions.revisor as string) || ''
  const aprovado = (data.documentOptions.aprovado as string) || ''

  const LABEL_COL_MM = 40
  const RESPONSAVEIS_LABEL_COL_MM = 50

  return [
    new Paragraph({
      pageBreakBefore: true,
      alignment: AlignmentType.CENTER,
      indent: {
        left: mmToTwip(CONTENT_SIDE_PADDING_MM),
        right: mmToTwip(CONTENT_SIDE_PADDING_MM),
      },
      spacing: { before: 0, after: 0 },
      children: [
        new TextRun({
          text: 'HISTÓRICO',
          bold: true,
          size: TITLE_FONT_HALF_PT,
          color: BLACK_COLOR,
        }),
      ],
    }),
    spacerParagraph(6),
    buildCalloutTable('REVISÕES:'),
    spacerParagraph(6),
    buildHistoricoDataTable(
      [
        {
          label: 'Nº REVISÃO',
          value: 'ALTERAÇÕES SOLICITADAS',
          valueBold: true,
        },
        ...revisions.map(revision => ({
          label: revision.label,
          value: revision.description,
        })),
      ],
      LABEL_COL_MM,
    ),
    spacerParagraph(8),
    buildCalloutTable('RESPONSÁVEIS TÉCNICOS'),
    spacerParagraph(6),
    buildHistoricoDataTable(
      [
        { label: 'ORÇAMENTISTA:', value: orcamentista },
        { label: 'REVISOR:', value: revisor },
        { label: 'APROVADO:', value: aprovado },
      ],
      RESPONSAVEIS_LABEL_COL_MM,
    ),
  ]
}
