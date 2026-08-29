import { AlignmentType, Paragraph, Table, TextRun } from 'docx'
import {
  APRESENTACAO_DEFAULT_HTML,
  BLACK_COLOR,
  CONTENT_SIDE_PADDING_MM,
  TITLE_FONT_HALF_PT,
  mmToTwip,
  type DocxDocumentData,
} from '../constants'
import { buildCalloutTable, spacerParagraph } from '../sharedBuilders'
import { htmlToParagraphs } from '../htmlParser'

export function buildEscopoChildren(
  data: DocxDocumentData,
): (Paragraph | Table)[] {
  const apresentacaoText =
    (data.documentOptions.apresentacaoText as string) ??
    APRESENTACAO_DEFAULT_HTML
  const escopoAreasText = (data.documentOptions.escopoAreasText as string) ?? ''

  return [
    new Paragraph({
      pageBreakBefore: true,
      alignment: AlignmentType.CENTER,
      indent: {
        left: mmToTwip(CONTENT_SIDE_PADDING_MM),
        right: mmToTwip(CONTENT_SIDE_PADDING_MM),
      },
      spacing: { before: 0, after: mmToTwip(6) },
      children: [
        new TextRun({
          text: 'ESCOPO DE FORNECIMENTO',
          bold: true,
          size: TITLE_FONT_HALF_PT,
          color: BLACK_COLOR,
        }),
      ],
    }),
    buildCalloutTable('APRESENTAÇÃO'),
    spacerParagraph(4),
    ...htmlToParagraphs(apresentacaoText),
    spacerParagraph(6),
    buildCalloutTable('ESCOPO DE ÁREAS'),
    spacerParagraph(4),
    ...htmlToParagraphs(escopoAreasText),
  ]
}
