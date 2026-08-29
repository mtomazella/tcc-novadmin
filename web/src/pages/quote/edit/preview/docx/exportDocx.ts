import {
  AlignmentType,
  Document,
  LevelFormat,
  Packer,
  PageBorderDisplay,
  PageBorderOffsetFrom,
} from 'docx'
import type {
  AreaOrderGroup,
  DelimitacaoSection,
  QuoteElement,
  QuoteScope,
} from '@novadmin/lib/types'
import {
  elements as elementsLib,
  computedElements as computedElementsLib,
  metragens as metragensLib,
} from '@novadmin/lib/quote'

import {
  BLACK_COLOR,
  BODY_BOTTOM_MARGIN_MM,
  BODY_FONT_HALF_PT,
  BODY_TOP_MARGIN_MM,
  BULLET_LIST_INDENT_MM,
  BULLET_LIST_REF,
  CONTENT_SIDE_PADDING_MM,
  FOOTER_GUTTER_MM,
  HEADER_GUTTER_MM,
  ORANGE_PAGE_BORDER,
  PAGE_MARGIN_MM,
  mmToTwip,
  type DocxDocumentData,
} from './constants'
import {
  base64ToUint8Array,
  loadImageDimensions,
  renderSvgToPng,
} from './imageHelpers'
import { buildDocumentFooter, buildDocumentHeader } from './sharedBuilders'
import { buildFirstPageChildren } from './pages/firstPage'
import { buildSumarioChildren } from './pages/sumario'
import { buildHistoricoChildren } from './pages/historico'
import { buildEscopoChildren } from './pages/escopo'
import { buildDelimitacaoPageChildren } from './pages/delimitacao'
import { buildAreasDeForecimentoPageChildren } from './pages/areasDeForecimento'
import { buildMetragensChildren } from './pages/metragens'
import { buildFaturamentoChildren } from './pages/faturamento'
import { buildDeAcordoChildren } from './pages/deAcordo'
import {
  buildCondicoesGeraisChildren,
  buildNaoPrevistoChildren,
  CONDICOES_GERAIS_WATERMARK_SVG,
  NAO_PREVISTO_WATERMARK_SVG,
} from './pages/condicoesGerais'
import { buildPropostaChildren } from './pages/proposta'

export type { DocxDocumentData }

export async function exportToDocx(
  filename: string,
  data: DocxDocumentData,
): Promise<void> {
  const [condicoesWatermarkImage, naoPrevistoWatermarkImage] =
    await Promise.all([
      renderSvgToPng(CONDICOES_GERAIS_WATERMARK_SVG, 200),
      renderSvgToPng(NAO_PREVISTO_WATERMARK_SVG, 200),
    ])

  const documentHeader = buildDocumentHeader(data.quoteNumber)
  const documentFooter = buildDocumentFooter()

  const delimitacaoSections = (data.documentOptions.delimitacaoSections ??
    []) as DelimitacaoSection[]

  const fileMap = new Map<
    number,
    { data: Uint8Array; widthPx: number; heightPx: number }
  >()

  await Promise.all(
    data.quoteFiles.map(async quoteFile => {
      try {
        const fileData = base64ToUint8Array(quoteFile.fileContent)
        const dimensions = await loadImageDimensions(fileData)
        fileMap.set(quoteFile.id, { data: fileData, ...dimensions })
      } catch {
        // skip images that fail to load — section renders without them
      }
    }),
  )

  const delimitacaoChildrenArrays = await Promise.all(
    delimitacaoSections.map(section =>
      buildDelimitacaoPageChildren(section, fileMap),
    ),
  )

  // Build derived + computed elements per scope for the ÁREAS DE FORNECIMENTO pages.
  const derivedElementsMap = new Map<number, QuoteElement[]>(
    data.scopes.map(scope => {
      const rawScopeElements = data.scopeElements.filter(
        element => element.scopeId === scope.id,
      )
      const derivedScopeElements = rawScopeElements.map(
        elementsLib.appendElementDerivedValues,
      )
      const computedScopeElements =
        computedElementsLib.generateComputedElements(derivedScopeElements, [
          scope,
        ])
      return [scope.id!, [...derivedScopeElements, ...computedScopeElements]]
    }),
  )

  const areasOverrides =
    (data.documentOptions.areasDeForecimento as Record<
      string,
      Record<string, string>
    >) ?? {}

  const storedAreaOrder =
    (data.documentOptions.areaOrder as AreaOrderGroup[] | undefined) ?? []
  const resolvedAreaOrder =
    storedAreaOrder.length === 0
      ? metragensLib.buildDefaultAreaOrder(data.scopes)
      : metragensLib.resolveAreaOrder(data.scopes, storedAreaOrder)

  const scopeMapDocx = new Map<number, QuoteScope>(
    data.scopes.map(scope => [scope.id!, scope]),
  )

  const areasPageChildren = resolvedAreaOrder.flatMap(group =>
    group.scopeIds
      .map((scopeId: number) => scopeMapDocx.get(scopeId))
      .filter(
        (scope: QuoteScope | undefined): scope is QuoteScope =>
          scope !== undefined,
      )
      .flatMap((scope: QuoteScope, indexInGroup: number) => {
        const calloutText =
          indexInGroup === 0 ? group.name : 'FORNECIMENTO COMPLEMENTAR'
        return buildAreasDeForecimentoPageChildren(
          scope,
          derivedElementsMap.get(scope.id!) ?? [],
          areasOverrides[String(scope.id)] ?? {},
          calloutText,
        )
      }),
  )

  const metragensChildren = buildMetragensChildren(
    resolvedAreaOrder,
    scopeMapDocx,
    derivedElementsMap,
  )

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: BULLET_LIST_REF,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: {
                run: {
                  font: 'Arial',
                  size: BODY_FONT_HALF_PT,
                  color: BLACK_COLOR,
                },
                paragraph: {
                  indent: {
                    left: mmToTwip(
                      CONTENT_SIDE_PADDING_MM + BULLET_LIST_INDENT_MM,
                    ),
                    hanging: mmToTwip(BULLET_LIST_INDENT_MM),
                  },
                },
              },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: BODY_FONT_HALF_PT },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: mmToTwip(BODY_TOP_MARGIN_MM),
              bottom: mmToTwip(BODY_BOTTOM_MARGIN_MM),
              left: mmToTwip(PAGE_MARGIN_MM),
              right: mmToTwip(PAGE_MARGIN_MM),
              header: mmToTwip(HEADER_GUTTER_MM),
              footer: mmToTwip(FOOTER_GUTTER_MM),
            },
            borders: {
              pageBorders: {
                offsetFrom: PageBorderOffsetFrom.PAGE,
                display: PageBorderDisplay.ALL_PAGES,
              },
              pageBorderTop: ORANGE_PAGE_BORDER,
              pageBorderBottom: ORANGE_PAGE_BORDER,
              pageBorderLeft: ORANGE_PAGE_BORDER,
              pageBorderRight: ORANGE_PAGE_BORDER,
            },
          },
        },
        headers: { default: documentHeader },
        footers: { default: documentFooter },
        children: [
          ...buildFirstPageChildren(data),
          ...buildSumarioChildren(data),
          ...buildHistoricoChildren(data),
          ...buildEscopoChildren(data),
          ...delimitacaoChildrenArrays.flat(),
          ...areasPageChildren,
          ...metragensChildren,
          ...buildCondicoesGeraisChildren(data, condicoesWatermarkImage),
          ...buildNaoPrevistoChildren(data, naoPrevistoWatermarkImage),
          ...buildPropostaChildren(data),
          ...buildFaturamentoChildren(),
          ...buildDeAcordoChildren(),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${filename}.docx`
  anchor.click()
  URL.revokeObjectURL(url)
}
