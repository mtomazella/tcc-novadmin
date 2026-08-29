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
  ALL_DARK_BORDERS,
  BLACK_COLOR,
  BODY_FONT_HALF_PT,
  CELL_NO_BORDERS,
  CONTENT_EFFECTIVE_WIDTH_MM,
  CONTENT_SIDE_PADDING_MM,
  ORANGE_COLOR,
  SECTION_TITLE_SPACING,
  TABLE_NO_BORDERS,
  TITLE_FONT_HALF_PT,
  mmToTwip,
} from '../constants'
import { buildCalloutTable, spacerParagraph } from '../sharedBuilders'

const LIST_HANGING_MM = 6

function buildNumberedItem(
  number: number,
  runs: TextRun[],
  spacingAfterMm: number,
): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.DISTRIBUTE,
    indent: {
      left: mmToTwip(CONTENT_SIDE_PADDING_MM + LIST_HANGING_MM),
      hanging: mmToTwip(LIST_HANGING_MM),
      right: mmToTwip(CONTENT_SIDE_PADDING_MM),
    },
    spacing: { after: mmToTwip(spacingAfterMm) },
    children: [
      new TextRun({
        text: `${number}. `,
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
      ...runs,
    ],
  })
}

function buildCompanyBox(lines: [string, string, string]): Table {
  const [nameLine, cnpjLine, ieLine] = lines
  return new Table({
    width: { size: mmToTwip(CONTENT_EFFECTIVE_WIDTH_MM), type: WidthType.DXA },
    indent: { size: mmToTwip(CONTENT_SIDE_PADDING_MM), type: WidthType.DXA },
    borders: TABLE_NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: ALL_DARK_BORDERS,
            margins: {
              top: mmToTwip(3),
              bottom: mmToTwip(3),
              left: mmToTwip(4),
              right: mmToTwip(4),
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: nameLine,
                    bold: true,
                    size: BODY_FONT_HALF_PT,
                    color: BLACK_COLOR,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: cnpjLine,
                    size: BODY_FONT_HALF_PT,
                    color: BLACK_COLOR,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: ieLine,
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
}

export function buildFaturamentoChildren(): (Paragraph | Table)[] {
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
        text: 'CONDIÇÕES GERAIS DE FATURAMENTO',
        bold: true,
        size: TITLE_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
    ],
  })

  const faturamentoCallout = buildCalloutTable('FATURAMENTO')

  const faturamentoItem1 = buildNumberedItem(
    1,
    [
      new TextRun({
        text: 'A condição de pagamento ',
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
      new TextRun({
        text: 'será combinada entre as partes',
        bold: true,
        size: BODY_FONT_HALF_PT,
        color: ORANGE_COLOR,
      }),
      new TextRun({
        text: ' no momento do aceite da proposta.',
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
    ],
    3,
  )

  const faturamentoItem2 = buildNumberedItem(
    2,
    [
      new TextRun({
        text: 'Em caso de atraso no pagamento das parcelas, ',
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
      new TextRun({
        text: 'será aplicada multa de 2% (dois por cento) sobre o valor devido, acrescida de juros de mora de 2% (dois por cento) ao mês.',
        bold: true,
        size: BODY_FONT_HALF_PT,
        color: ORANGE_COLOR,
      }),
    ],
    4,
  )

  const paraFaturamento = new Paragraph({
    alignment: AlignmentType.DISTRIBUTE,
    indent: {
      left: mmToTwip(CONTENT_SIDE_PADDING_MM),
      right: mmToTwip(CONTENT_SIDE_PADDING_MM),
    },
    spacing: { after: mmToTwip(3) },
    children: [
      new TextRun({
        text: 'Para o faturamento, disponível duas opções do grupo:',
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
    ],
  })

  const company1Table = buildCompanyBox([
    'Empresa Exemplo LTDA.',
    'CNPJ: 00.000.000/0001-00',
    'IE: 000.000.000.000',
  ])

  const ouParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    indent: {
      left: mmToTwip(CONTENT_SIDE_PADDING_MM),
      right: mmToTwip(CONTENT_SIDE_PADDING_MM),
    },
    spacing: { before: mmToTwip(2), after: mmToTwip(2) },
    children: [
      new TextRun({ text: 'ou', size: BODY_FONT_HALF_PT, color: BLACK_COLOR }),
    ],
  })

  const company2Table = buildCompanyBox([
    'Fornecedor Exemplo LTDA.',
    'CNPJ: 00.000.000/0002-00',
    'I.E: 000.000.000.001',
  ])

  const observacoesCallout = buildCalloutTable('OBSERVAÇÕES')

  const observacaoItem1 = buildNumberedItem(
    1,
    [
      new TextRun({
        text: 'Os materiais descritos neste documento deverão ser entregues conforme o ',
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
      new TextRun({
        text: 'cronograma previamente estabelecido em visita técnica',
        bold: true,
        size: BODY_FONT_HALF_PT,
        color: ORANGE_COLOR,
      }),
      new TextRun({
        text: ', contado a partir da emissão da Ordem de Fornecimento, no endereço indicado nesta proposta.',
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
    ],
    3,
  )

  const observacaoItem2 = buildNumberedItem(
    2,
    [
      new TextRun({
        text: 'O prazo de entrega poderá ser ajustado em ',
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
      new TextRun({
        text: 'comum acordo entre as partes, desde que a necessidade seja comunicada com, no mínimo, 3 (três) dias úteis de antecedência em relação às datas previstas no cronograma',
        bold: true,
        size: BODY_FONT_HALF_PT,
        color: ORANGE_COLOR,
      }),
      new TextRun({
        text: '. A solicitação deve ser formalizada por e-mail (com confirmação de leitura) ou por correspondência com aviso de recebimento.',
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
    ],
    0,
  )

  // ── Page 2 ──────────────────────────────────────────────────────────────────

  const page2TitleParagraph = new Paragraph({
    pageBreakBefore: true,
    alignment: AlignmentType.CENTER,
    indent: {
      left: mmToTwip(CONTENT_SIDE_PADDING_MM),
      right: mmToTwip(CONTENT_SIDE_PADDING_MM),
    },
    spacing: SECTION_TITLE_SPACING,
    children: [
      new TextRun({
        text: 'CONDIÇÕES GERAIS DE FATURAMENTO',
        bold: true,
        size: TITLE_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
    ],
  })

  const observacoesCallout2 = buildCalloutTable('OBSERVAÇÕES')

  const observacaoItem3 = buildNumberedItem(
    3,
    [
      new TextRun({
        text: 'Caso o material seja produzido e, por qualquer motivo, a CONTRATANTE não possa recebê-lo em sua obra, ',
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
      new TextRun({
        text: 'a CONTRATADA estará autorizada, se for o caso, a realizar o faturamento e, como garantia, emitirá uma carta de fiel depositário.',
        bold: true,
        size: BODY_FONT_HALF_PT,
        color: ORANGE_COLOR,
      }),
      new TextRun({
        text: ' O material ficará armazenado em nosso estoque até que a entrega possa ser efetivada, ',
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
      new TextRun({
        text: 'PELO PRAZO MÁXIMO DE 60 (SESSENTA) DIAS.',
        bold: true,
        size: BODY_FONT_HALF_PT,
        color: ORANGE_COLOR,
      }),
    ],
    3,
  )

  const observacaoItem4 = buildNumberedItem(
    4,
    [
      new TextRun({
        text: 'Em caso ',
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
      new TextRun({
        text: 'de desistência por parte da CONTRATANTE',
        bold: true,
        size: BODY_FONT_HALF_PT,
        color: ORANGE_COLOR,
      }),
      new TextRun({
        text: ', após a assinatura e concordância da presente proposta, ',
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
      new TextRun({
        text: 'será aplicada uma multa de 20% (vinte por cento) sobre o valor total do fornecimento',
        bold: true,
        size: BODY_FONT_HALF_PT,
        color: ORANGE_COLOR,
      }),
      new TextRun({
        text: ', a título de ressarcimento pelos custos iniciais já assumidos, como visita técnica prévia, elaboração de projeto e demais preparativos operacionais.',
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
    ],
    4,
  )

  const consideracoesFinaisCallout = buildCalloutTable('CONSIDERAÇÕES FINAIS')

  const consideracoesParagraph1 = new Paragraph({
    alignment: AlignmentType.DISTRIBUTE,
    indent: {
      left: mmToTwip(CONTENT_SIDE_PADDING_MM),
      right: mmToTwip(CONTENT_SIDE_PADDING_MM),
    },
    spacing: { after: mmToTwip(3) },
    children: [
      new TextRun({
        text: 'Esta contratação passará a ter validade a partir do aceite formal desta proposta.',
        bold: true,
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
    ],
  })

  const consideracoesParagraph2 = new Paragraph({
    alignment: AlignmentType.DISTRIBUTE,
    indent: {
      left: mmToTwip(CONTENT_SIDE_PADDING_MM),
      right: mmToTwip(CONTENT_SIDE_PADDING_MM),
    },
    spacing: { after: mmToTwip(3) },
    children: [
      new TextRun({
        text: 'Após o aceite formal desta proposta, ',
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
      new TextRun({
        text: 'será emitida uma nota fiscal no valor total do fornecimento, acompanhada dos boletos com as datas de vencimento previamente estabelecidas.',
        bold: true,
        size: BODY_FONT_HALF_PT,
        color: ORANGE_COLOR,
      }),
      new TextRun({
        text: ' Para o envio dos materiais, será emitida uma nota fiscal de simples remessa, juntamente com o respectivo romaneio.',
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
    ],
  })

  const consideracoesParagraph3 = new Paragraph({
    alignment: AlignmentType.DISTRIBUTE,
    indent: {
      left: mmToTwip(CONTENT_SIDE_PADDING_MM),
      right: mmToTwip(CONTENT_SIDE_PADDING_MM),
    },
    spacing: { after: mmToTwip(3) },
    children: [
      new TextRun({
        text: 'Sem mais para o momento, permanecemos à disposição para quaisquer esclarecimentos e aguardamos seu parecer.',
        size: BODY_FONT_HALF_PT,
        color: BLACK_COLOR,
      }),
    ],
  })

  const validadeParagraph = new Paragraph({
    alignment: AlignmentType.DISTRIBUTE,
    indent: {
      left: mmToTwip(CONTENT_SIDE_PADDING_MM),
      right: mmToTwip(CONTENT_SIDE_PADDING_MM),
    },
    spacing: { after: mmToTwip(6) },
    children: [
      new TextRun({
        text: 'Validade desta proposta: 7 (sete) dias a partir da data de sua emissão.',
        size: BODY_FONT_HALF_PT,
        color: ORANGE_COLOR,
      }),
    ],
  })

  const emissionDate = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const dateBoxTable = new Table({
    width: { size: mmToTwip(CONTENT_EFFECTIVE_WIDTH_MM), type: WidthType.DXA },
    indent: { size: mmToTwip(CONTENT_SIDE_PADDING_MM), type: WidthType.DXA },
    borders: TABLE_NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: ALL_DARK_BORDERS,
            margins: {
              top: mmToTwip(3),
              bottom: mmToTwip(3),
              left: mmToTwip(4),
              right: mmToTwip(4),
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `DOCUMENTO EMITIDO EM: ${emissionDate}`,
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
    ],
  })

  return [
    titleParagraph,
    faturamentoCallout,
    faturamentoItem1,
    faturamentoItem2,
    paraFaturamento,
    company1Table,
    ouParagraph,
    company2Table,
    spacerParagraph(6),
    observacoesCallout,
    observacaoItem1,
    observacaoItem2,
    page2TitleParagraph,
    observacoesCallout2,
    observacaoItem3,
    observacaoItem4,
    consideracoesFinaisCallout,
    consideracoesParagraph1,
    consideracoesParagraph2,
    consideracoesParagraph3,
    validadeParagraph,
    dateBoxTable,
  ]
}
