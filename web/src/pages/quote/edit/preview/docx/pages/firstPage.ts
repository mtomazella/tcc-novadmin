import { AlignmentType, Paragraph, Table, TextRun } from 'docx'
import {
  BLACK_COLOR,
  CONTENT_SIDE_PADDING_MM,
  TITLE_FONT_HALF_PT,
  mmToTwip,
  type DocxDocumentData,
} from '../constants'
import {
  buildCalloutTable,
  buildInfoElementTable,
  spacerParagraph,
} from '../sharedBuilders'

export function buildFirstPageChildren(
  data: DocxDocumentData,
): (Paragraph | Table)[] {
  const clientAddress = (data.documentOptions.clientAddress as string) || ''
  const obraAddress = (data.documentOptions.obraAddress as string) || ''
  const contactName = (data.documentOptions.contactName as string) || ''
  const contactPhone = (data.documentOptions.contactPhone as string) || ''
  const contactEmail = (data.documentOptions.contactEmail as string) || ''
  const vendedorName = (data.documentOptions.vendedorName as string) || ''
  const vendedorPhone = (data.documentOptions.vendedorPhone as string) || ''
  const vendedorEmail = (data.documentOptions.vendedorEmail as string) || ''

  return [
    // Title: 55mm from top, two lines, indented 15mm
    new Paragraph({
      alignment: AlignmentType.CENTER,
      indent: {
        left: mmToTwip(CONTENT_SIDE_PADDING_MM),
        right: mmToTwip(CONTENT_SIDE_PADDING_MM),
      },
      spacing: { before: mmToTwip(55), after: mmToTwip(23) },
      children: [
        new TextRun({
          text: 'PROPOSTA PARA FORNECIMENTO',
          bold: true,
          size: TITLE_FONT_HALF_PT,
          color: BLACK_COLOR,
        }),
        new TextRun({
          text: 'DE FÔRMA PRONTA',
          bold: true,
          size: TITLE_FONT_HALF_PT,
          color: BLACK_COLOR,
          break: 1,
        }),
      ],
    }),

    buildCalloutTable(`Nº PROPOSTA – ${data.quoteNumber}`, true),
    spacerParagraph(20),

    buildInfoElementTable([
      { label: 'CLIENTE:', value: data.clientName, valueBold: true },
      { label: 'ENDEREÇO:', value: clientAddress },
    ]),
    spacerParagraph(4),

    buildInfoElementTable([
      { label: 'OBRA:', value: data.obraName, valueBold: true },
      { label: 'ENDEREÇO:', value: obraAddress },
    ]),
    spacerParagraph(4),

    buildInfoElementTable([
      { label: 'A.C.:', value: contactName, valueBold: true },
      { label: 'TEL.:', value: contactPhone },
      { label: 'E-MAIL:', value: contactEmail },
    ]),
    spacerParagraph(4),

    buildInfoElementTable([
      { label: 'VENDEDOR:', value: vendedorName, valueBold: true },
      { label: 'TEL.:', value: vendedorPhone },
      { label: 'E-MAIL:', value: vendedorEmail },
    ]),
  ]
}
