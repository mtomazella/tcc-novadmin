import {
  AlignmentType,
  LeaderType,
  Paragraph,
  Table,
  TabStopType,
  TextRun,
} from 'docx'
import type { DelimitacaoSection } from '@novadmin/lib/types'
import {
  BLACK_COLOR,
  CONTENT_SIDE_PADDING_MM,
  TITLE_FONT_HALF_PT,
  TOC_FONT_HALF_PT,
  TOC_RIGHT_TAB_MM,
  TOC_SUBSECTION_INDENT_MM,
  mmToTwip,
  type DocxDocumentData,
} from '../constants'

interface TocEntry {
  title: string
  page: number
  level: 1 | 2
}

function buildTocEntryParagraph(entry: TocEntry): Paragraph {
  const leftIndent =
    mmToTwip(CONTENT_SIDE_PADDING_MM) +
    (entry.level === 2 ? mmToTwip(TOC_SUBSECTION_INDENT_MM) : 0)

  return new Paragraph({
    tabStops: [
      {
        type: TabStopType.RIGHT,
        position: mmToTwip(TOC_RIGHT_TAB_MM),
        leader: LeaderType.DOT,
      },
    ],
    indent: { left: leftIndent },
    spacing: { before: 0, after: mmToTwip(1) },
    children: [
      new TextRun({
        text: `${entry.title}\t${entry.page}`,
        bold: entry.level === 1,
        size: TOC_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
    ],
  })
}

export function buildSumarioChildren(
  data: DocxDocumentData,
): (Paragraph | Table)[] {
  const delimitacaoSections = (data.documentOptions.delimitacaoSections ??
    []) as DelimitacaoSection[]

  const tocEntries: TocEntry[] = [
    { title: 'Histórico', page: 3, level: 1 },
    { title: 'Escopo de Fornecimento', page: 4, level: 1 },
    ...delimitacaoSections.map((section, index) => ({
      title: section.title || 'DELIMITAÇÃO',
      page: 5 + index,
      level: 1 as const,
    })),
    ...data.scopes.map((scope, scopeIndex) => ({
      title: scope.name,
      page: 5 + delimitacaoSections.length + scopeIndex,
      level: 1 as const,
    })),
    {
      title: 'Metragens',
      page: 5 + delimitacaoSections.length + data.scopes.length,
      level: 1 as const,
    },
    {
      title: 'Condições Gerais de Fornecimento',
      page: 6 + delimitacaoSections.length + data.scopes.length,
      level: 1 as const,
    },
    {
      title: 'Não Previsto',
      page: 7 + delimitacaoSections.length + data.scopes.length,
      level: 1 as const,
    },
    {
      title: 'Proposta',
      page: 8 + delimitacaoSections.length + data.scopes.length,
      level: 1 as const,
    },
    {
      title: 'Condições Gerais de Faturamento',
      page: 9 + delimitacaoSections.length + data.scopes.length,
      level: 1 as const,
    },
    {
      title: 'De Acordo',
      page: 11 + delimitacaoSections.length + data.scopes.length,
      level: 1 as const,
    },
  ]

  return [
    new Paragraph({
      pageBreakBefore: true,
      alignment: AlignmentType.CENTER,
      indent: {
        left: mmToTwip(CONTENT_SIDE_PADDING_MM),
        right: mmToTwip(CONTENT_SIDE_PADDING_MM),
      },
      spacing: { before: mmToTwip(15), after: mmToTwip(10) },
      children: [
        new TextRun({
          text: 'SUMÁRIO',
          bold: true,
          size: TITLE_FONT_HALF_PT,
          color: BLACK_COLOR,
        }),
      ],
    }),
    ...tocEntries.map(buildTocEntryParagraph),
  ]
}
