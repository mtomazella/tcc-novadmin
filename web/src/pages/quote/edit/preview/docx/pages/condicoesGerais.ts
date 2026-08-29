import {
  AlignmentType,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  ImageRun,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalPositionRelativeFrom,
  WidthType,
} from 'docx'
import type { DocxDocumentData } from '../constants'
import {
  ALL_DARK_BORDERS,
  BLACK_COLOR,
  BODY_FONT_HALF_PT,
  CONTENT_EFFECTIVE_WIDTH_MM,
  CONTENT_SIDE_PADDING_MM,
  SECTION_TITLE_SPACING,
  TABLE_NO_BORDERS,
  TITLE_FONT_HALF_PT,
  mmToDocxPx,
  mmToEmu,
  mmToTwip,
} from '../constants'
import { buildCalloutTable } from '../sharedBuilders'
import { htmlToParagraphs } from '../htmlParser'
import type { LoadedImage } from '../imageHelpers'

// True page center: 297mm / 2 = 148.5mm; subtract half of icon size so the icon is centered
const WATERMARK_SIZE_MM = 60
const WATERMARK_TOP_OFFSET_MM = 297 / 2 - WATERMARK_SIZE_MM / 2 // ≈ 118.5mm

export const CONDICOES_GERAIS_WATERMARK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="200" height="200">' +
  '<path fill="rgba(22,163,74,0.13)" d="M16.59 7.58L10 14.17l-3.59-3.58L5 12l5 5 8-8z' +
  'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z' +
  'm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>' +
  '</svg>'

export const NAO_PREVISTO_WATERMARK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="200" height="200">' +
  '<path fill="rgba(220,38,38,0.13)" d="M14.59 8L12 10.59 9.41 8 8 9.41 10.59 12 8 14.59 9.41 16 12 13.41 14.59 16 16 14.59 13.41 12 16 9.41 14.59 8z' +
  'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2z' +
  'm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>' +
  '</svg>'

function buildWatermarkImageRun(watermarkImage: LoadedImage): ImageRun {
  return new ImageRun({
    data: watermarkImage.data,
    transformation: {
      width: mmToDocxPx(WATERMARK_SIZE_MM),
      height: mmToDocxPx(WATERMARK_SIZE_MM),
    },
    type: 'png',
    floating: {
      horizontalPosition: {
        align: HorizontalPositionAlign.CENTER,
        relative: HorizontalPositionRelativeFrom.PAGE,
      },
      verticalPosition: {
        offset: mmToEmu(WATERMARK_TOP_OFFSET_MM),
        relative: VerticalPositionRelativeFrom.PAGE,
      },
      allowOverlap: true,
      behindDocument: true,
    },
  })
}

const CONTENT_BOX_VERTICAL_PADDING_MM = 4
const CONTENT_BOX_HORIZONTAL_PADDING_MM = 2

export function buildCondicoesGeraisChildren(
  data: DocxDocumentData,
  watermarkImage: LoadedImage,
): (Paragraph | Table)[] {
  const condicoesGeraisText =
    (data.documentOptions.condicoesGeraisText as string) ?? ''

  const contentParagraphs = condicoesGeraisText.trim()
    ? htmlToParagraphs(condicoesGeraisText, 0)
    : [
        new Paragraph({
          children: [new TextRun({ text: '', size: BODY_FONT_HALF_PT })],
        }),
      ]

  // The watermark ImageRun is embedded in the title paragraph (which has
  // pageBreakBefore: true) so its anchor is always on the first page of
  // this section, regardless of how many pages the content table spans.
  const titleParagraph = new Paragraph({
    pageBreakBefore: true,
    alignment: AlignmentType.CENTER,
    indent: {
      left: mmToTwip(CONTENT_SIDE_PADDING_MM),
      right: mmToTwip(CONTENT_SIDE_PADDING_MM),
    },
    spacing: SECTION_TITLE_SPACING,
    children: [
      new TextRun({
        text: 'CONDIÇÕES GERAIS DE FORNECIMENTO',
        bold: true,
        size: TITLE_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
      buildWatermarkImageRun(watermarkImage),
    ],
  })

  const contentTable = new Table({
    width: { size: mmToTwip(CONTENT_EFFECTIVE_WIDTH_MM), type: WidthType.DXA },
    indent: { size: mmToTwip(CONTENT_SIDE_PADDING_MM), type: WidthType.DXA },
    borders: TABLE_NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: ALL_DARK_BORDERS,
            margins: {
              top: mmToTwip(CONTENT_BOX_VERTICAL_PADDING_MM),
              bottom: mmToTwip(CONTENT_BOX_VERTICAL_PADDING_MM),
              left: mmToTwip(CONTENT_BOX_HORIZONTAL_PADDING_MM),
              right: mmToTwip(CONTENT_BOX_HORIZONTAL_PADDING_MM),
            },
            children: contentParagraphs,
          }),
        ],
      }),
    ],
  })

  return [titleParagraph, buildCalloutTable('PREVISTO:'), contentTable]
}

export function buildNaoPrevistoChildren(
  data: DocxDocumentData,
  watermarkImage: LoadedImage,
): (Paragraph | Table)[] {
  const naoPrevistoText = (data.documentOptions.naoPrevistoText as string) ?? ''

  const contentParagraphs = naoPrevistoText.trim()
    ? htmlToParagraphs(naoPrevistoText, 0)
    : [
        new Paragraph({
          children: [new TextRun({ text: '', size: BODY_FONT_HALF_PT })],
        }),
      ]

  const titleParagraph = new Paragraph({
    pageBreakBefore: true,
    alignment: AlignmentType.CENTER,
    indent: {
      left: mmToTwip(CONTENT_SIDE_PADDING_MM),
      right: mmToTwip(CONTENT_SIDE_PADDING_MM),
    },
    spacing: SECTION_TITLE_SPACING,
    children: [
      new TextRun({
        text: 'CONDIÇÕES GERAIS DE FORNECIMENTO',
        bold: true,
        size: TITLE_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
      buildWatermarkImageRun(watermarkImage),
    ],
  })

  const contentTable = new Table({
    width: { size: mmToTwip(CONTENT_EFFECTIVE_WIDTH_MM), type: WidthType.DXA },
    indent: { size: mmToTwip(CONTENT_SIDE_PADDING_MM), type: WidthType.DXA },
    borders: TABLE_NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: ALL_DARK_BORDERS,
            margins: {
              top: mmToTwip(CONTENT_BOX_VERTICAL_PADDING_MM),
              bottom: mmToTwip(CONTENT_BOX_VERTICAL_PADDING_MM),
              left: mmToTwip(CONTENT_BOX_HORIZONTAL_PADDING_MM),
              right: mmToTwip(CONTENT_BOX_HORIZONTAL_PADDING_MM),
            },
            children: contentParagraphs,
          }),
        ],
      }),
    ],
  })

  return [titleParagraph, buildCalloutTable('NÃO PREVISTO:'), contentTable]
}
