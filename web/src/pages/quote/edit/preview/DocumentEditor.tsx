import React, { useMemo, useRef, useState } from 'react'
import type {
  AreaOrderGroup,
  DelimitacaoSection,
  IncludeDatabaseDates,
  Product,
  QuoteElement,
  QuoteFile,
  QuoteScope,
  QuoteScopeProductSnapshotMap,
} from '@novadmin/lib/types'
import {
  areasDeForecimento as areasDeForecimentoLib,
  computedElements as computedElementsLib,
  costSummary as costSummaryLib,
  elements as elementsLib,
  groupedElements as groupedElementsLib,
  metragens as metragensLib,
} from '@novadmin/lib/quote'
import type { QuotePricingOptionRow } from '@novadmin/lib/quote/pricingOptions'
import {
  formatCurrency,
  toLocalDecimal,
} from '@novadmin/lib/utils/unitConversion'

import RichTextEditor from '../../../../components/RichTextEditor'
import { A4Page } from './A4Page'
import { DeAcordoPage } from './DeAcordoPage'
import { FaturamentoPage } from './FaturamentoPage'
import { PaginatedSection, splitHtmlToBlocks } from './PaginatedSection'
import { SectionCallout } from './pageComponents'
import {
  LeftPanelField,
  RevisionListEditor,
  type HistoricoRevision,
} from './LeftPanelField'
import {
  DelimitacaoControlGroup,
  DelimitacaoImageBlock,
  DelimitacaoLimitsTable,
} from './DelimitacaoControlGroup'
import MetragensGroupsEditor from './MetragensGroupsEditor'
import {
  APRESENTACAO_DEFAULT_HTML,
  CONDICOES_GERAIS_DEFAULT_HTML,
  NAO_PREVISTO_DEFAULT_HTML,
  DIVIDER_STYLE,
  FIELD_LABEL_STYLE,
  FIXED_DOCUMENT_SECTIONS,
  FONT_SIZE_BODY,
  FONT_SIZE_TITLE,
  DARK_COLOR,
  FONT_SIZE_TOC,
  ORANGE_COLOR,
  TOC_SUBSECTION_COLOR,
  LEFT_PANEL_PADDING_TOP_PX,
  LEFT_PANEL_SLOT_PADDING_TOP_PX,
  LEFT_PANEL_WIDTH,
  LIGHT_ORANGE_COLOR,
  PAGE_SLOT_PX,
} from './documentConstants'

const { computeAreasDeForecimentoTable, deriveEspFromScope } =
  areasDeForecimentoLib

type JogosKey = 'pilar' | 'viga' | 'fundoAdicional' | 'laje' | 'tiraAdicional'
const JOGOS_ROW_KEYS: JogosKey[] = [
  'pilar',
  'viga',
  'fundoAdicional',
  'laje',
  'tiraAdicional',
]
const JOGOS_ROW_LABELS: Record<JogosKey, string> = {
  pilar: 'Pilar',
  viga: 'Viga',
  fundoAdicional: 'Fundo ad.',
  laje: 'Laje',
  tiraAdicional: 'Tira ad.',
}

function JogosInput({
  value,
  onChange,
}: {
  value: number | undefined
  onChange: (value: number) => void
}) {
  const [rawText, setRawText] = React.useState<string | null>(null)
  const displayValue =
    rawText !== null ? rawText : String(value ?? 0).padStart(2, '0')

  return (
    <input
      type="text"
      style={{
        width: '70px',
        fontSize: '14px',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        padding: '4px 6px',
        outline: 'none',
        boxSizing: 'border-box',
      }}
      value={displayValue}
      onChange={event => setRawText(event.target.value)}
      onBlur={() => {
        const parsed = parseInt(rawText ?? '', 10)
        const safeValue = isNaN(parsed) || parsed < 0 ? 0 : parsed
        onChange(safeValue)
        setRawText(null)
      }}
    />
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface DocumentEditorProps {
  quoteNumber: string
  clientName: string
  obraName: string
  documentOptions: Record<string, unknown>
  isEditing: boolean
  isCollapsed: boolean
  onChange: (newOptions: Record<string, unknown>) => void
  quoteId: number
  quoteFileList: QuoteFile[]
  quoteFileContents: Map<number, string>
  onRequestFileContent: (id: number) => void
  onFileUploaded: (file: QuoteFile) => void
  onFileDeleted: (id: number) => void
  scopes: QuoteScope[]
  scopeElements: QuoteElement[]
  quoteProducts: QuoteScopeProductSnapshotMap
  selectedPricingOption: QuotePricingOptionRow | null
}

interface InfoRow {
  label: string
  value: string
  valueBold?: boolean
}

interface TocEntry {
  title: string
  page: number
  level: 1 | 2 | 3
}

interface AreasDeFornecimentoScopeOverrides {
  cs?: string
  cc?: string
  pd?: string
  esp?: string
  material?: string
  consideracoes?: string
  boundary?: string
  projectFileName?: string
  jogos?: Partial<Record<JogosKey, number>>
}

// ── Page display components ───────────────────────────────────────────────────
// Small components used only to compose the A4 page content below.

function FirstPageInfoElement({ rows }: { rows: InfoRow[] }) {
  return (
    <div
      style={{
        display: 'table',
        width: '100%',
        tableLayout: 'fixed',
        marginBottom: '5mm',
      }}
    >
      {rows.map(({ label, value, valueBold }, index) => (
        <div key={index} style={{ display: 'table-row' }}>
          <span
            style={{
              display: 'table-cell',
              width: '32mm',
              fontSize: FONT_SIZE_BODY,
              fontWeight: 'bold',
              verticalAlign: 'top',
              lineHeight: '1.4',
            }}
          >
            {label}
          </span>
          <span
            style={{
              display: 'table-cell',
              fontSize: FONT_SIZE_BODY,
              fontWeight: valueBold ? 'bold' : 'normal',
              verticalAlign: 'top',
              lineHeight: '1.4',
              textAlign: 'left',
            }}
          >
            {value || '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

function TocEntryRow({ title, page, level }: TocEntry) {
  const isLevel1 = level === 1
  const textColor = isLevel1 ? DARK_COLOR : TOC_SUBSECTION_COLOR
  const indent = level === 3 ? '20mm' : level === 2 ? '10mm' : '0'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '2mm',
        marginBottom: '1mm',
      }}
    >
      <span
        style={{
          fontSize: FONT_SIZE_TOC,
          fontWeight: isLevel1 ? 'bold' : 'normal',
          color: textColor,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          paddingLeft: indent,
          lineHeight: '1.4',
        }}
      >
        {title}
      </span>
      <span
        style={{
          flex: 1,
          borderBottom: `1px dotted ${textColor}`,
          marginBottom: '3px',
        }}
      />
      <span
        style={{
          fontSize: FONT_SIZE_TOC,
          fontWeight: isLevel1 ? 'bold' : 'normal',
          color: textColor,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          lineHeight: '1.4',
        }}
      >
        {page}
      </span>
    </div>
  )
}

// Gray data table used in the HISTÓRICO page.
function GrayTable({
  rows,
  marginTop = '4mm',
  marginBottom = '2mm',
}: {
  rows: Array<{ label: string; value: string; valueBold?: boolean }>
  marginTop?: string
  marginBottom?: string
}) {
  return (
    <div
      style={{
        display: 'table',
        width: '100%',
        tableLayout: 'fixed',
        marginTop,
        marginBottom,
      }}
    >
      {rows.map(({ label, value, valueBold }, index) => (
        <div key={index} style={{ display: 'table-row' }}>
          <span
            style={{
              display: 'table-cell',
              width: '40mm',
              padding: '1mm 2mm',
              fontSize: FONT_SIZE_BODY,
              fontWeight: 'bold',
              lineHeight: '1.4',
              verticalAlign: 'top',
            }}
          >
            {label}
          </span>
          <span
            style={{
              display: 'table-cell',
              padding: '1mm 2mm',
              fontSize: FONT_SIZE_BODY,
              fontWeight: valueBold ? 'bold' : 'normal',
              lineHeight: '1.4',
              verticalAlign: 'top',
            }}
          >
            {value || '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

// Two-column label/value table with configurable label column width (no gray background).
// Used in ÁREAS DE FORNECIMENTO pages where two different column widths are needed.
function DataTable({
  rows,
  labelColWidth,
  autoWidth = false,
}: {
  rows: Array<{
    label: string
    value: string
    valueBold?: boolean
    valueFontSize?: string
  }>
  labelColWidth: string
  autoWidth?: boolean
}) {
  return (
    <div
      style={{
        display: 'table',
        width: autoWidth ? 'auto' : '100%',
        tableLayout: autoWidth ? 'auto' : 'fixed',
        marginBottom: '2mm',
      }}
    >
      {rows.map(({ label, value, valueBold, valueFontSize }, index) => (
        <div key={index} style={{ display: 'table-row' }}>
          <span
            style={{
              display: 'table-cell',
              width: labelColWidth,
              fontSize: FONT_SIZE_BODY,
              fontWeight: 'bold',
              padding: '1mm 2mm',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
          <span
            style={{
              display: 'table-cell',
              fontSize: valueFontSize ?? FONT_SIZE_BODY,
              fontWeight: valueBold ? 'bold' : 'normal',
              padding: '1mm 2mm 1mm 5mm',
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}

// Page content for a single ÁREAS DE FORNECIMENTO scope page.
function AreasDeForecimentoPage({
  scope,
  scopePageElements,
  overrides,
  calloutText,
}: {
  scope: QuoteScope
  scopePageElements: QuoteElement[]
  overrides: AreasDeFornecimentoScopeOverrides
  calloutText: string
}) {
  const tableData = computeAreasDeForecimentoTable(scopePageElements)
  const rowsWithJogos = tableData.rows.map((row, index) => {
    const jogosKey = JOGOS_ROW_KEYS[index]
    const overriddenJogos =
      jogosKey !== undefined ? overrides.jogos?.[jogosKey] : undefined
    return overriddenJogos !== undefined
      ? { ...row, jogos: overriddenJogos }
      : row
  })
  const effectivePd = overrides.pd ?? scope.ceilingHeight ?? ''
  const effectiveEsp = overrides.esp ?? deriveEspFromScope(scope)
  const effectiveBoundary = overrides.boundary ?? scope.boundary ?? ''
  const effectiveProjectFileName =
    overrides.projectFileName ?? scope.projectFileName ?? ''
  const effectiveMaterial = overrides.material ?? 'Plastificado'
  const effectiveConsideracoes =
    overrides.consideracoes ?? scope.observations ?? ''
  const materialHeader = `${effectiveMaterial.toUpperCase()} (m²)`

  return (
    <div>
      <div
        style={{
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: FONT_SIZE_TITLE,
          marginBottom: '2mm',
          paddingTop: '10mm',
        }}
      >
        ÁREAS DE FORNECIMENTO
      </div>

      <SectionCallout text={calloutText} marginBottom="4mm" />

      {/* Info grid — two tables side by side */}
      <div style={{ display: 'flex', gap: '5mm', marginBottom: '4mm' }}>
        {/* Left table — grows to fill remaining space */}
        <div style={{ flex: 1 }}>
          <DataTable
            labelColWidth="40mm"
            rows={[
              { label: 'Fornecimento para:', value: scope.name },
              {
                label: 'Projeto Referência:',
                value: effectiveProjectFileName,
                valueFontSize: '13px',
              },
              { label: 'Delimitação:', value: effectiveBoundary },
              { label: 'Material:', value: effectiveMaterial },
            ]}
          />
        </div>
        {/* Right table — shrinks to content width */}
        <div style={{ flex: '0 0 auto' }}>
          <DataTable
            labelColWidth="18mm"
            autoWidth
            rows={[
              { label: 'CS.:', value: overrides.cs ?? '' },
              { label: 'CC.:', value: overrides.cc ?? '' },
              { label: 'PD.:', value: effectivePd },
              { label: 'ESP.:', value: effectiveEsp },
            ]}
          />
        </div>
      </div>

      <p
        style={{
          fontSize: FONT_SIZE_BODY,
          marginBottom: '4mm',
        }}
      >
        A seguir estão as metragens estimadas para os elementos deste pavimento:
      </p>

      {/* Elements table — header and footer rows use orange background */}
      <table
        style={{
          width: '100%',
          tableLayout: 'fixed',
          marginBottom: '4mm',
          borderCollapse: 'collapse',
        }}
      >
        <thead>
          <tr>
            {(['ELEMENTOS', 'JOGOS', materialHeader] as const).map(
              (header, headerIndex) => (
                <td
                  key={headerIndex}
                  style={{
                    backgroundColor: '#7C3AED',
                    fontWeight: 'bold',
                    fontSize: FONT_SIZE_BODY,
                    padding: '0 2mm',
                    textAlign: headerIndex === 0 ? 'left' : 'center',
                    border: '1px solid #000000',
                  }}
                >
                  {header}
                </td>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rowsWithJogos.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td
                style={{
                  fontSize: FONT_SIZE_BODY,
                  padding: '0 2mm',
                  border: '1px solid #000000',
                }}
              >
                {row.label}
              </td>
              <td
                style={{
                  fontSize: FONT_SIZE_BODY,
                  padding: '0 2mm',
                  textAlign: 'center',
                  border: '1px solid #000000',
                }}
              >
                {String(row.jogos).padStart(2, '0')}
              </td>
              <td
                style={{
                  fontSize: FONT_SIZE_BODY,
                  padding: '0 2mm',
                  textAlign: 'center',
                  border: '1px solid #000000',
                }}
              >
                {row.m2 !== null ? row.m2.toFixed(2) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={2}
              style={{
                backgroundColor: '#7C3AED',
                fontWeight: 'bold',
                fontSize: FONT_SIZE_BODY,
                padding: '0 2mm',
                textAlign: 'center',
                border: '1px solid #000000',
              }}
            >
              ÁREA TOTAL:
            </td>
            <td
              style={{
                backgroundColor: '#7C3AED',
                fontWeight: 'bold',
                fontSize: FONT_SIZE_BODY,
                padding: '0 2mm',
                textAlign: 'center',
                border: '1px solid #000000',
              }}
            >
              {tableData.totalM2.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>

      <SectionCallout text="CONSIDERAÇÕES" marginBottom="0" />

      <div
        className="document-rich-content"
        style={{
          fontSize: FONT_SIZE_BODY,
          lineHeight: '1.4',
          border: '1px solid #000000',
          borderTop: 'none',
          padding: '2mm',
          minHeight: '60mm',
          flex: 1,
        }}
        dangerouslySetInnerHTML={{ __html: effectiveConsideracoes }}
      />
    </div>
  )
}

function MetragensPage({
  resolvedAreaOrder,
  scopeMap,
  derivedElementsByScope,
}: {
  resolvedAreaOrder: AreaOrderGroup[]
  scopeMap: Map<number, QuoteScope>
  derivedElementsByScope: Map<number, QuoteElement[]>
}) {
  const allScopeIds = resolvedAreaOrder.flatMap(group => group.scopeIds)
  const totalM2 = allScopeIds.reduce((sum, scopeId) => {
    const scopeElements = derivedElementsByScope.get(scopeId) ?? []
    return sum + computeAreasDeForecimentoTable(scopeElements).totalM2
  }, 0)

  const cellStyle: React.CSSProperties = {
    border: '1px solid #1a1a1a',
    fontSize: FONT_SIZE_BODY,
    padding: 0,
  }
  const orangeCellStyle: React.CSSProperties = {
    ...cellStyle,
    backgroundColor: '#7C3AED',
    fontWeight: 'bold',
    textAlign: 'center',
  }
  const groupCellStyle: React.CSSProperties = {
    ...orangeCellStyle,
    backgroundColor: LIGHT_ORANGE_COLOR,
  }

  return (
    <div>
      <div
        style={{
          paddingTop: '10mm',
          fontSize: FONT_SIZE_TITLE,
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        METRAGENS
      </div>
      <SectionCallout text="RESUMO DE ÁREAS" marginBottom="4mm" />
      <p style={{ fontSize: FONT_SIZE_BODY, marginBottom: '4mm' }}>
        Abaixo resumo das áreas previstas em orçamento:
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <td style={orangeCellStyle}>PAVIMENTOS</td>
            <td style={{ ...orangeCellStyle, width: '35mm' }}>
              METRAGENS (m²)
            </td>
          </tr>
        </thead>
        <tbody>
          {resolvedAreaOrder.map(group => (
            <React.Fragment key={group.id}>
              <tr>
                <td colSpan={2} style={groupCellStyle}>
                  {group.name}
                </td>
              </tr>
              {group.scopeIds.map((scopeId: number, indexInGroup: number) => {
                const scope = scopeMap.get(scopeId)
                if (!scope) return null
                const scopeM2 = computeAreasDeForecimentoTable(
                  derivedElementsByScope.get(scopeId) ?? [],
                ).totalM2
                const labelPrefix =
                  indexInGroup === 0
                    ? 'Fornecimento para '
                    : 'Fornecimento complementar para '
                return (
                  <tr key={scopeId}>
                    <td style={cellStyle}>
                      {labelPrefix}
                      <strong>{scope.name}</strong>
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>
                      {scopeM2.toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </React.Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ ...orangeCellStyle, textAlign: 'left' }}>
              METRAGEM TOTAL
            </td>
            <td style={{ ...orangeCellStyle, textAlign: 'center' }}>
              {totalM2.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ── Rich text section helpers ─────────────────────────────────────────────────

const RICH_TEXT_BLOCK_STYLE: React.CSSProperties = {
  fontSize: FONT_SIZE_BODY,
  lineHeight: '1.4',
}

// Returns an array of React children for a labelled rich text section:
// [<callout + first block>, <block 2>, …]
// Pairing the callout with the first block prevents a stranded callout at page bottom.
function richTextSectionChildren(
  calloutText: string,
  html: string,
): React.ReactNode[] {
  const [firstBlock, ...remainingBlocks] = splitHtmlToBlocks(html)
  return [
    <div key="callout-first">
      <SectionCallout text={calloutText} />
      {firstBlock ? (
        <div
          className="document-rich-content"
          dangerouslySetInnerHTML={{ __html: firstBlock }}
          style={RICH_TEXT_BLOCK_STYLE}
        />
      ) : null}
    </div>,
    ...remainingBlocks.map((block, blockIndex) => (
      <div
        key={`block-${blockIndex}`}
        className="document-rich-content"
        dangerouslySetInnerHTML={{ __html: block }}
        style={RICH_TEXT_BLOCK_STYLE}
      />
    )),
  ]
}

function PropostaPage({
  pageNumber,
  quoteNumber,
  allElements,
  scopes,
  selectedPricingOption,
}: {
  pageNumber: number
  quoteNumber: string
  allElements: QuoteElement[]
  scopes: QuoteScope[]
  selectedPricingOption: QuotePricingOptionRow | null
}) {
  // Piece counts are only needed to split the garfo row by tipo for display;
  // all monetary totals below come from computeCostSummary, the same
  // function the Values tab uses, so the two never diverge.
  const garfoCounts = computedElementsLib.computeGarfoPieceCounts(
    allElements,
    scopes,
  )
  const groupedElementsMap =
    groupedElementsLib.elementsToGroupedElements(allElements)
  const costSummary = costSummaryLib.computeCostSummary({
    elementGroups: groupedElementsMap,
    effectiveFixedCosts: [],
    selectedPricingOption: selectedPricingOption ?? undefined,
  })
  const { totalM2Reto, totalM2Cambotado } = costSummary

  const valueReto = selectedPricingOption?.valueReto ?? 0
  const valueCambotado = selectedPricingOption?.valueCambotado ?? 0
  const valueGarfo = selectedPricingOption?.valueGarfo ?? 0

  const retoCents = costSummary.pricingTotalReto
  const cambotadoCents = costSummary.pricingTotalCambotado
  const formsTotalCents = retoCents + cambotadoCents

  // costSummary.pricingTotalGarfo depends on the garfo product's modifier
  // flag, which requires that product to be present in the quote's product
  // snapshot. The borda/interno rows above don't have that dependency (they
  // key off productId directly), so the total must be summed from those
  // already-displayed values to stay internally consistent even when the
  // snapshot is incomplete.
  const bordaTotalCents = Math.round(garfoCounts.bordaCount * valueGarfo)
  const internoTotalCents = Math.round(garfoCounts.internoCount * valueGarfo)
  const garfoTotalCents = bordaTotalCents + internoTotalCents

  const grandTotalCents = formsTotalCents + garfoTotalCents

  const tableCellStyle: React.CSSProperties = {
    border: `1px solid ${DARK_COLOR}`,
    padding: '1mm 2mm',
    fontSize: '14px',
    verticalAlign: 'middle',
  }
  const tableHeaderCellStyle = (
    width: string | undefined,
  ): React.CSSProperties => ({
    ...tableCellStyle,
    fontWeight: 'bold',
    backgroundColor: LIGHT_ORANGE_COLOR,
    textAlign: 'center',
    width: width,
  })
  const tableOrangeCellStyle: React.CSSProperties = {
    ...tableCellStyle,
    fontWeight: 'bold',
    backgroundColor: ORANGE_COLOR,
    textAlign: 'center',
  }
  const tableFooterCellStyle: React.CSSProperties = {
    ...tableOrangeCellStyle,
  }
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  }
  const leadTextStyle: React.CSSProperties = {
    fontSize: FONT_SIZE_BODY,
    margin: '1mm 0 3mm 0',
  }

  return (
    <A4Page pageNumber={pageNumber} quoteNumber={quoteNumber}>
      <div
        style={{
          paddingTop: '10mm',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: FONT_SIZE_TITLE,
          color: DARK_COLOR,
          marginBottom: '4mm',
        }}
      >
        PROPOSTA
      </div>

      <SectionCallout
        text="DESCRITIVO DOS VALORES CONTRATADOS"
        marginBottom="10px"
        marginTop="0px"
      />

      <p style={leadTextStyle}>
        A seguir valores considerados para precificação das formas:
      </p>

      <table style={tableStyle}>
        <tbody>
          <tr>
            <td colSpan={5} style={tableOrangeCellStyle}>
              FORNECIMENTO PARA FÔRMAS
            </td>
          </tr>
          <tr>
            <td style={tableHeaderCellStyle('195px')}>ORIGEM</td>
            <td style={tableHeaderCellStyle('120px')}>M²</td>
            <td style={tableHeaderCellStyle('20px')}>X</td>
            <td style={tableHeaderCellStyle('75px')}>VALOR (m²)</td>
            <td style={tableHeaderCellStyle('120px')}>VALOR POR ELEMENTO</td>
          </tr>
          <tr>
            <td style={tableCellStyle}>Valor metro quadrado (reto)</td>
            <td style={{ ...tableCellStyle, textAlign: 'center' }}>
              {toLocalDecimal(totalM2Reto, 2)} m²
            </td>
            <td style={{ ...tableCellStyle, textAlign: 'center' }}>X</td>
            <td style={{ ...tableCellStyle, textAlign: 'center' }}>
              {formatCurrency(valueReto)}
            </td>
            <td style={{ ...tableCellStyle, textAlign: 'center' }}>
              {formatCurrency(retoCents)}
            </td>
          </tr>
          <tr>
            <td style={tableCellStyle}>Valor metro cambotado (curvo)</td>
            <td style={{ ...tableCellStyle, textAlign: 'center' }}>
              {toLocalDecimal(totalM2Cambotado, 2)} m²
            </td>
            <td style={{ ...tableCellStyle, textAlign: 'center' }}>X</td>
            <td style={{ ...tableCellStyle, textAlign: 'center' }}>
              {formatCurrency(valueCambotado)}
            </td>
            <td style={{ ...tableCellStyle, textAlign: 'center' }}>
              {formatCurrency(cambotadoCents)}
            </td>
          </tr>
          <tr>
            <td colSpan={4} style={tableFooterCellStyle}>
              VALOR TOTAL
            </td>
            <td style={tableFooterCellStyle}>
              {formatCurrency(formsTotalCents)}
            </td>
          </tr>
        </tbody>
      </table>

      <p style={leadTextStyle}>
        A seguir valores considerados para precificação dos garfos:
      </p>

      <table style={tableStyle}>
        <tbody>
          <tr>
            <td colSpan={5} style={tableOrangeCellStyle}>
              FORNECIMENTO PARA GARFOS
            </td>
          </tr>
          <tr>
            <td style={tableHeaderCellStyle('175px')}>ORIGEM</td>
            <td style={tableHeaderCellStyle('130px')}>QUANT.</td>
            <td style={tableHeaderCellStyle('20px')}>X</td>
            <td style={tableHeaderCellStyle('75px')}>VALOR (peças)</td>
            <td style={tableHeaderCellStyle('130px')}>VALOR POR ELEMENTO</td>
          </tr>
          <tr>
            <td style={tableCellStyle}>Garfos para vigas de borda</td>
            <td style={{ ...tableCellStyle, textAlign: 'center' }}>
              {String(garfoCounts.bordaCount).padStart(2, '0')} pçs
            </td>
            <td style={{ ...tableCellStyle, textAlign: 'center' }}>X</td>
            <td style={{ ...tableCellStyle, textAlign: 'center' }}>
              {formatCurrency(valueGarfo)}
            </td>
            <td style={{ ...tableCellStyle, textAlign: 'center' }}>
              {formatCurrency(bordaTotalCents)}
            </td>
          </tr>
          <tr>
            <td style={tableCellStyle}>Garfos para vigas internas</td>
            <td style={{ ...tableCellStyle, textAlign: 'center' }}>
              {String(garfoCounts.internoCount).padStart(2, '0')} pçs
            </td>
            <td style={{ ...tableCellStyle, textAlign: 'center' }}>X</td>
            <td style={{ ...tableCellStyle, textAlign: 'center' }}>
              {formatCurrency(valueGarfo)}
            </td>
            <td style={{ ...tableCellStyle, textAlign: 'center' }}>
              {formatCurrency(internoTotalCents)}
            </td>
          </tr>
          <tr>
            <td colSpan={4} style={tableFooterCellStyle}>
              VALOR TOTAL
            </td>
            <td style={tableFooterCellStyle}>
              {formatCurrency(garfoTotalCents)}
            </td>
          </tr>
        </tbody>
      </table>

      <p style={leadTextStyle}>
        Somando os valores finais apresentados, temos:
      </p>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '8mm',
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                border: `1px solid ${DARK_COLOR}`,
                padding: '3mm 4mm',
                fontWeight: 'bold',
                fontSize: FONT_SIZE_BODY,
                backgroundColor: '#ffffff',
                width: '55%',
              }}
            >
              VALOR TOTAL PROPOSTA:
            </td>
            <td
              style={{
                border: `1px solid ${DARK_COLOR}`,
                padding: '3mm 4mm',
                fontWeight: 'bold',
                fontSize: FONT_SIZE_BODY,
                backgroundColor: ORANGE_COLOR,
                textAlign: 'center',
              }}
            >
              {formatCurrency(grandTotalCents)}
            </td>
          </tr>
        </tbody>
      </table>

      <p
        style={{
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '6mm',
          textAlign: 'center',
        }}
      >
        Quaisquer revisões nos projetos mencionados deverão ser{' '}
        <span style={{ color: ORANGE_COLOR }}>
          formalizadas e aprovadas por escrito, mediante concordância expressa
          de ambas as partes.
        </span>
      </p>

      <p
        style={{
          fontSize: FONT_SIZE_BODY,
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        PRAZO DE ENTREGA: 40 A 50 DIAS APÓS O FECHAMENTO.
      </p>
    </A4Page>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DocumentEditor({
  quoteNumber,
  clientName,
  obraName,
  documentOptions,
  isEditing,
  isCollapsed,
  onChange,
  quoteId,
  quoteFileList,
  quoteFileContents,
  onRequestFileContent,
  onFileUploaded,
  onFileDeleted,
  scopes,
  scopeElements,
  quoteProducts,
  selectedPricingOption,
}: DocumentEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  // Per-section page count, updated by each PaginatedSection via onPageCountChange.
  const [pageCounts, setPageCounts] = useState<Partial<Record<string, number>>>(
    { faturamento: 2 },
  )

  const productMap = useMemo(
    () =>
      new Map(
        Object.entries(quoteProducts ?? {}).map(([productId, product]) => [
          Number(productId),
          product as unknown as IncludeDatabaseDates<Product>,
        ]),
      ),
    [quoteProducts],
  )

  // Derived and computed elements keyed by scope ID, ready for ÁREAS DE FORNECIMENTO pages.
  // Task 4 will consume this map when rendering the areas pages.
  const derivedElementsByScope = useMemo(() => {
    return new Map(
      scopes.map(scope => {
        const rawScopeElements = scopeElements.filter(
          element => element.scopeId === scope.id,
        )
        const derivedScopeElements = rawScopeElements.map(
          elementsLib.appendElementDerivedValues,
        )
        const computedScopeElements =
          computedElementsLib.generateComputedElements(
            derivedScopeElements,
            [scope],
            productMap,
          )
        return [scope.id!, [...derivedScopeElements, ...computedScopeElements]]
      }),
    )
  }, [scopes, scopeElements, productMap])
  const resolvedAreaOrder = useMemo(() => {
    const storedAreaOrder =
      (documentOptions.areaOrder as AreaOrderGroup[] | undefined) ?? []
    if (storedAreaOrder.length === 0) {
      return metragensLib.buildDefaultAreaOrder(scopes)
    }
    return metragensLib.resolveAreaOrder(scopes, storedAreaOrder)
  }, [scopes, documentOptions.areaOrder])

  const scopeMap = useMemo(
    () => new Map(scopes.map(scope => [scope.id!, scope])),
    [scopes],
  )

  // Quote-wide totals (PropostaPage, etc.) must exclude elements with no
  // scope — they're not part of any priced area. Matches ValuesTab.tsx's
  // allQuoteElements, which applies the same filter.
  const allDerivedAndComputedElements = useMemo(() => {
    const scopedElements =
      elementsLib.filterElementsAssignedToScope(scopeElements)
    const derivedElements = scopedElements.map(
      elementsLib.appendElementDerivedValues,
    )
    return [
      ...derivedElements,
      ...computedElementsLib.generateComputedElements(
        derivedElements,
        scopes,
        productMap,
      ),
    ]
  }, [scopeElements, scopes, productMap])

  const updateAreaOrder = (updatedGroups: AreaOrderGroup[]) => {
    onChange({ ...documentOptions, areaOrder: updatedGroups })
  }

  // ── documentOptions field reads ───────────────────────────────────────────
  const clientAddress = (documentOptions.clientAddress as string) || ''
  const obraAddress = (documentOptions.obraAddress as string) || ''
  const contactName = (documentOptions.contactName as string) || ''
  const contactPhone = (documentOptions.contactPhone as string) || ''
  const contactEmail = (documentOptions.contactEmail as string) || ''
  const vendedorName = (documentOptions.vendedorName as string) || ''
  const vendedorPhone = (documentOptions.vendedorPhone as string) || ''
  const vendedorEmail = (documentOptions.vendedorEmail as string) || ''
  const revisions =
    (documentOptions.revisions as HistoricoRevision[] | undefined) ?? []
  const orcamentista = (documentOptions.orcamentista as string) || ''
  const revisor = (documentOptions.revisor as string) || ''
  const aprovado = (documentOptions.aprovado as string) || ''
  const apresentacaoText =
    (documentOptions.apresentacaoText as string) ?? APRESENTACAO_DEFAULT_HTML
  const escopoAreasText = (documentOptions.escopoAreasText as string) ?? ''
  const condicoesGeraisText =
    (documentOptions.condicoesGeraisText as string) ||
    CONDICOES_GERAIS_DEFAULT_HTML
  const naoPrevistoText =
    (documentOptions.naoPrevistoText as string) || NAO_PREVISTO_DEFAULT_HTML
  const delimitacaoSections = (documentOptions.delimitacaoSections ??
    []) as DelimitacaoSection[]

  // ── documentOptions mutation helpers ─────────────────────────────────────
  const updateField = (key: string, value: string) => {
    onChange({ ...documentOptions, [key]: value })
  }

  const updateRevisions = (newRevisions: HistoricoRevision[]) => {
    onChange({ ...documentOptions, revisions: newRevisions })
  }

  const addDelimitacaoSection = () => {
    const newSection: DelimitacaoSection = {
      id: crypto.randomUUID(),
      title: 'DELIMITAÇÃO',
      observacoesText: '',
      legendItems: [],
      selectedFileIds: [],
    }
    onChange({
      ...documentOptions,
      delimitacaoSections: [...delimitacaoSections, newSection],
    })
  }

  const updateDelimitacaoSection = (
    sectionId: string,
    updates: Partial<DelimitacaoSection>,
  ) => {
    onChange({
      ...documentOptions,
      delimitacaoSections: delimitacaoSections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section,
      ),
    })
  }

  const removeDelimitacaoSection = (sectionId: string) => {
    onChange({
      ...documentOptions,
      delimitacaoSections: delimitacaoSections.filter(
        section => section.id !== sectionId,
      ),
    })
  }

  // ── Page numbering ────────────────────────────────────────────────────────
  // Build the full ordered section list: historico → escopo → delimitação(s) → áreas (one per scope).
  const documentSections: Array<{ key: string; title: string }> = [
    ...FIXED_DOCUMENT_SECTIONS.slice(0, 2), // historico, escopo
    ...delimitacaoSections.map(section => ({
      key: `delimitacao-${section.id}`,
      title: section.title,
    })),
    ...resolvedAreaOrder.flatMap(group =>
      group.scopeIds
        .map((scopeId: number) => scopeMap.get(scopeId))
        .filter(
          (scope: QuoteScope | undefined): scope is QuoteScope =>
            scope !== undefined,
        )
        .map((scope: QuoteScope) => ({
          key: `areas-${scope.id}`,
          title: scope.name,
        })),
    ),
    { key: 'metragens', title: 'METRAGENS' },
    { key: 'condicoesGerais', title: 'CONDIÇÕES GERAIS DE FORNECIMENTO' },
    { key: 'naoPrevisto', title: 'NÃO PREVISTO' },
    { key: 'proposta', title: 'PROPOSTA' },
    { key: 'faturamento', title: 'CONDIÇÕES GERAIS DE FATURAMENTO' },
    { key: 'deAcordo', title: 'DE ACORDO' },
  ]

  const sumarioPageCount = pageCounts['sumario'] ?? 1
  let nextSectionPage = 2 + sumarioPageCount
  const sectionStartPages: Record<string, number> = {}
  for (const section of documentSections) {
    sectionStartPages[section.key] = nextSectionPage
    nextSectionPage += pageCounts[section.key] ?? 1
  }

  const areaSectionKeys = new Set(
    resolvedAreaOrder.flatMap(group => group.scopeIds.map(id => `areas-${id}`)),
  )
  const delimitacaoSectionKeys = new Set(
    delimitacaoSections.map(section => `delimitacao-${section.id}`),
  )
  let areasHeaderInserted = false
  let delimitacoesHeaderInserted = false
  const tocEntries: TocEntry[] = []
  for (const section of documentSections) {
    if (areaSectionKeys.has(section.key)) {
      if (!areasHeaderInserted) {
        tocEntries.push({
          title: 'ÁREAS DE FORNECIMENTO',
          page: sectionStartPages[section.key] ?? 0,
          level: 1,
        })
        for (const group of resolvedAreaOrder) {
          const firstScopeId = group.scopeIds[0]
          const groupPage =
            firstScopeId != null
              ? sectionStartPages[`areas-${firstScopeId}`] ?? 0
              : 0
          tocEntries.push({ title: group.name, page: groupPage, level: 2 })
          for (const scopeId of group.scopeIds) {
            const scope = scopeMap.get(scopeId)
            if (!scope) continue
            tocEntries.push({
              title: scope.name,
              page: sectionStartPages[`areas-${scopeId}`] ?? 0,
              level: 3,
            })
          }
        }
        areasHeaderInserted = true
      }
    } else if (delimitacaoSectionKeys.has(section.key)) {
      if (!delimitacoesHeaderInserted) {
        tocEntries.push({
          title: 'DELIMITAÇÕES',
          page: sectionStartPages[section.key] ?? 0,
          level: 1,
        })
        delimitacoesHeaderInserted = true
      }
      tocEntries.push({
        title: section.title,
        page: sectionStartPages[section.key] ?? 0,
        level: 2,
      })
    } else if (section.key === 'escopo') {
      tocEntries.push({
        title: section.title,
        page: sectionStartPages[section.key] ?? 0,
        level: 1,
      })
      tocEntries.push({
        title: 'APRESENTAÇÃO',
        page: sectionStartPages[section.key] ?? 0,
        level: 2,
      })
      tocEntries.push({
        title: 'ESCOPO DE ÁREAS',
        page: sectionStartPages[section.key] ?? 0,
        level: 2,
      })
    } else if (section.key === 'metragens') {
      tocEntries.push({
        title: section.title,
        page: sectionStartPages[section.key] ?? 0,
        level: 1,
      })
      tocEntries.push({
        title: 'RESUMO DE ÁREAS',
        page: sectionStartPages[section.key] ?? 0,
        level: 2,
      })
    } else if (section.key === 'faturamento') {
      const faturamentoPage = sectionStartPages[section.key] ?? 0
      tocEntries.push({
        title: 'CONDIÇÕES GERAIS DE FATURAMENTO',
        page: faturamentoPage,
        level: 1,
      })
      tocEntries.push({ title: 'FATURAMENTO', page: faturamentoPage, level: 2 })
      tocEntries.push({ title: 'OBSERVAÇÕES', page: faturamentoPage, level: 2 })
      tocEntries.push({
        title: 'CONSIDERAÇÕES FINAIS',
        page: faturamentoPage + 1,
        level: 2,
      })
    } else if (section.key === 'condicoesGerais') {
      tocEntries.push({
        title: 'CONDIÇÕES GERAIS DE FORNECIMENTO',
        page: sectionStartPages[section.key] ?? 0,
        level: 1,
      })
      tocEntries.push({
        title: 'PREVISTO:',
        page: sectionStartPages[section.key] ?? 0,
        level: 2,
      })
    } else if (section.key === 'naoPrevisto') {
      tocEntries.push({
        title: 'NÃO PREVISTO:',
        page: sectionStartPages[section.key] ?? 0,
        level: 2,
      })
    } else if (section.key === 'proposta') {
      tocEntries.push({
        title: 'PROPOSTA',
        page: sectionStartPages[section.key] ?? 0,
        level: 1,
      })
    } else {
      tocEntries.push({
        title: section.title,
        page: sectionStartPages[section.key] ?? 0,
        level: 1,
      })
    }
  }

  // ── Left panel slot inner wrapper (shared padding for all active slots) ───
  const slotInnerStyle: React.CSSProperties = {
    padding: '12px',
    paddingTop: LEFT_PANEL_SLOT_PADDING_TOP_PX,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  }

  return (
    <div ref={rootRef} style={{ display: 'flex' }}>
      {/* ── Left control column ──────────────────────────────────────────── */}
      <div
        className="border-r border-gray-200 bg-gray-50"
        style={{
          width: isCollapsed ? 0 : LEFT_PANEL_WIDTH,
          flexShrink: 0,
          transition: 'width 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: LEFT_PANEL_WIDTH,
            display: 'flex',
            flexDirection: 'column',
            paddingTop: LEFT_PANEL_PADDING_TOP_PX,
          }}
        >
          {/* Cover page slot */}
          <div
            style={{ height: PAGE_SLOT_PX, overflow: 'hidden', flexShrink: 0 }}
          >
            <div style={slotInnerStyle}>
              <LeftPanelField
                label="Endereço do Cliente"
                value={clientAddress}
                isEditing={isEditing}
                placeholder="Rua, número, cidade..."
                onChange={value => updateField('clientAddress', value)}
              />
              <LeftPanelField
                label="Endereço da Obra"
                value={obraAddress}
                isEditing={isEditing}
                placeholder="Rua, número, cidade..."
                onChange={value => updateField('obraAddress', value)}
              />
              <div style={DIVIDER_STYLE} />
              <LeftPanelField
                label="A.C. (Contato)"
                value={contactName}
                isEditing={isEditing}
                placeholder="Nome do contato"
                onChange={value => updateField('contactName', value)}
              />
              <LeftPanelField
                label="Telefone do Contato"
                value={contactPhone}
                isEditing={isEditing}
                placeholder="(11) 9.1234-5678"
                onChange={value => updateField('contactPhone', value)}
              />
              <LeftPanelField
                label="E-mail do Contato"
                value={contactEmail}
                isEditing={isEditing}
                placeholder="email@dominio.com"
                onChange={value => updateField('contactEmail', value)}
              />
              <div style={DIVIDER_STYLE} />
              <LeftPanelField
                label="Vendedor"
                value={vendedorName}
                isEditing={isEditing}
                placeholder="Nome do vendedor"
                onChange={value => updateField('vendedorName', value)}
              />
              <LeftPanelField
                label="Telefone do Vendedor"
                value={vendedorPhone}
                isEditing={isEditing}
                placeholder="(11) 9.1234-5678"
                onChange={value => updateField('vendedorPhone', value)}
              />
              <LeftPanelField
                label="E-mail do Vendedor"
                value={vendedorEmail}
                isEditing={isEditing}
                placeholder="email@dominio.com"
                onChange={value => updateField('vendedorEmail', value)}
              />
            </div>
          </div>

          {/* Sumário slot — empty spacer, no controls */}
          <div
            style={{
              height: (pageCounts['sumario'] ?? 1) * PAGE_SLOT_PX,
              flexShrink: 0,
            }}
          />

          {/* Histórico slot */}
          <div
            style={{ height: PAGE_SLOT_PX, overflow: 'hidden', flexShrink: 0 }}
          >
            <div style={slotInnerStyle}>
              <RevisionListEditor
                revisions={revisions}
                isEditing={isEditing}
                onChange={updateRevisions}
              />
              <div style={DIVIDER_STYLE} />
              <LeftPanelField
                label="Orçamentista"
                value={orcamentista}
                isEditing={isEditing}
                placeholder="Nome do orçamentista"
                onChange={value => updateField('orcamentista', value)}
              />
              <LeftPanelField
                label="Revisor"
                value={revisor}
                isEditing={isEditing}
                placeholder="Nome do revisor"
                onChange={value => updateField('revisor', value)}
              />
              <LeftPanelField
                label="Aprovado"
                value={aprovado}
                isEditing={isEditing}
                placeholder="Nome do aprovador"
                onChange={value => updateField('aprovado', value)}
              />
            </div>
          </div>

          {/* Escopo slot */}
          <div
            style={{
              height: (pageCounts['escopo'] ?? 1) * PAGE_SLOT_PX,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <div style={slotInnerStyle}>
              <span style={FIELD_LABEL_STYLE}>Apresentação</span>
              <RichTextEditor
                value={apresentacaoText}
                onChange={newValue => updateField('apresentacaoText', newValue)}
                isEditing={isEditing}
                placeholder="Texto de apresentação..."
              />
              <div style={DIVIDER_STYLE} />
              <span style={FIELD_LABEL_STYLE}>Escopo de Áreas</span>
              <RichTextEditor
                value={escopoAreasText}
                onChange={newValue => updateField('escopoAreasText', newValue)}
                isEditing={isEditing}
                placeholder="Descreva o escopo de áreas..."
              />
            </div>
          </div>

          {/* Delimitação slots — one per section, matching right-column page heights */}
          {delimitacaoSections.map(section => {
            const sectionKey = `delimitacao-${section.id}`
            return (
              <div
                key={section.id}
                style={{
                  height: (pageCounts[sectionKey] ?? 1) * PAGE_SLOT_PX,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <div style={{ paddingTop: LEFT_PANEL_SLOT_PADDING_TOP_PX }}>
                  <DelimitacaoControlGroup
                    section={section}
                    quoteFileList={quoteFileList}
                    isEditing={isEditing}
                    quoteId={quoteId}
                    onUpdate={updates =>
                      updateDelimitacaoSection(section.id, updates)
                    }
                    onRemove={() => removeDelimitacaoSection(section.id)}
                    onFileUploaded={onFileUploaded}
                    onFileDeleted={onFileDeleted}
                  />
                </div>
              </div>
            )
          })}

          {isEditing && (
            <div style={{ padding: '12px' }}>
              <button
                onClick={addDelimitacaoSection}
                style={{
                  fontSize: '13px',
                  color: '#ffffff',
                  background: '#7C3AED',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '7px 12px',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                + Adicionar Delimitação
              </button>
            </div>
          )}

          {/* ÁREAS DE FORNECIMENTO slots — rendered in group order */}
          {resolvedAreaOrder.flatMap(group =>
            group.scopeIds
              .map((scopeId: number) => scopeMap.get(scopeId))
              .filter(
                (scope: QuoteScope | undefined): scope is QuoteScope =>
                  scope !== undefined,
              )
              .map((scope: QuoteScope) => {
                const areasOverrides =
                  (
                    (documentOptions.areasDeForecimento ?? {}) as Record<
                      string,
                      AreasDeFornecimentoScopeOverrides
                    >
                  )[String(scope.id)] ?? {}

                const updateScopeAreasOverride = (
                  key: keyof AreasDeFornecimentoScopeOverrides,
                  value: string,
                ) => {
                  onChange({
                    ...documentOptions,
                    areasDeForecimento: {
                      ...((documentOptions.areasDeForecimento as object) ?? {}),
                      [String(scope.id)]: { ...areasOverrides, [key]: value },
                    },
                  })
                }

                const updateScopeJogos = (
                  jogosKey: JogosKey,
                  value: number | undefined,
                ) => {
                  onChange({
                    ...documentOptions,
                    areasDeForecimento: {
                      ...((documentOptions.areasDeForecimento as object) ?? {}),
                      [String(scope.id)]: {
                        ...areasOverrides,
                        jogos: {
                          ...(areasOverrides.jogos ?? {}),
                          [jogosKey]: value,
                        },
                      },
                    },
                  })
                }

                const derivedPd = scope.ceilingHeight ?? ''
                const derivedEsp = deriveEspFromScope(scope)

                return (
                  <div
                    key={scope.id}
                    style={{
                      height: PAGE_SLOT_PX,
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <div style={slotInnerStyle}>
                      <span style={FIELD_LABEL_STYLE}>{scope.name}</span>
                      <LeftPanelField
                        label="Projeto Referência"
                        value={areasOverrides.projectFileName ?? ''}
                        placeholder={scope.projectFileName ?? ''}
                        isEditing={isEditing}
                        onChange={value =>
                          updateScopeAreasOverride('projectFileName', value)
                        }
                      />
                      <LeftPanelField
                        label="Delimitação"
                        value={areasOverrides.boundary ?? ''}
                        placeholder={scope.boundary ?? ''}
                        isEditing={isEditing}
                        onChange={value =>
                          updateScopeAreasOverride('boundary', value)
                        }
                      />
                      <LeftPanelField
                        label="Material"
                        value={areasOverrides.material ?? ''}
                        placeholder="Plastificado"
                        isEditing={isEditing}
                        onChange={value =>
                          updateScopeAreasOverride('material', value)
                        }
                      />
                      <LeftPanelField
                        label="CS"
                        value={areasOverrides.cs ?? ''}
                        isEditing={isEditing}
                        onChange={value =>
                          updateScopeAreasOverride('cs', value)
                        }
                      />
                      <LeftPanelField
                        label="CC"
                        value={areasOverrides.cc ?? ''}
                        isEditing={isEditing}
                        onChange={value =>
                          updateScopeAreasOverride('cc', value)
                        }
                      />
                      <LeftPanelField
                        label="PD"
                        value={areasOverrides.pd ?? ''}
                        placeholder={String(derivedPd)}
                        isEditing={isEditing}
                        onChange={value =>
                          updateScopeAreasOverride('pd', value)
                        }
                      />
                      <LeftPanelField
                        label="ESP"
                        value={areasOverrides.esp ?? ''}
                        placeholder={derivedEsp}
                        isEditing={isEditing}
                        onChange={value =>
                          updateScopeAreasOverride('esp', value)
                        }
                      />
                      <div>
                        <span style={FIELD_LABEL_STYLE}>Jogos</span>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                            marginTop: '2px',
                          }}
                        >
                          {JOGOS_ROW_KEYS.map(jogosKey => (
                            <div
                              key={jogosKey}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '14px',
                                  color: '#374151',
                                  width: '70px',
                                  flexShrink: 0,
                                }}
                              >
                                {JOGOS_ROW_LABELS[jogosKey]}
                              </span>
                              {isEditing ? (
                                <JogosInput
                                  value={areasOverrides.jogos?.[jogosKey]}
                                  onChange={numericValue =>
                                    updateScopeJogos(jogosKey, numericValue)
                                  }
                                />
                              ) : (
                                <span
                                  style={{
                                    fontSize: '14px',
                                    color: '#1a1a1a',
                                  }}
                                >
                                  {String(
                                    areasOverrides.jogos?.[jogosKey] ?? 0,
                                  ).padStart(2, '0')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span style={FIELD_LABEL_STYLE}>Considerações</span>
                        <RichTextEditor
                          value={
                            areasOverrides.consideracoes ??
                            scope.observations ??
                            ''
                          }
                          onChange={html =>
                            updateScopeAreasOverride('consideracoes', html)
                          }
                          isEditing={isEditing}
                          placeholder={scope.observations ?? ''}
                        />
                      </div>
                    </div>
                  </div>
                )
              }),
          )}

          {/* METRAGENS slot */}
          <div
            style={{ height: PAGE_SLOT_PX, overflow: 'hidden', flexShrink: 0 }}
          >
            <div style={slotInnerStyle}>
              <span style={FIELD_LABEL_STYLE}>Grupos de Fornecimento</span>
              <MetragensGroupsEditor
                groups={resolvedAreaOrder}
                scopes={scopes}
                isEditing={isEditing}
                onChange={updateAreaOrder}
              />
            </div>
          </div>

          {/* CONDIÇÕES GERAIS slot */}
          <div
            style={{
              height: (pageCounts['condicoesGerais'] ?? 1) * PAGE_SLOT_PX,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <div style={slotInnerStyle}>
              <span style={FIELD_LABEL_STYLE}>
                Condições Gerais de Fornecimento
              </span>
              <RichTextEditor
                value={condicoesGeraisText}
                onChange={newValue =>
                  updateField('condicoesGeraisText', newValue)
                }
                isEditing={isEditing}
                placeholder="Descreva as condições gerais do fornecimento..."
              />
            </div>
          </div>

          {/* NÃO PREVISTO slot */}
          <div
            style={{
              height: (pageCounts['naoPrevisto'] ?? 1) * PAGE_SLOT_PX,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <div style={slotInnerStyle}>
              <span style={FIELD_LABEL_STYLE}>Não Previsto</span>
              <RichTextEditor
                value={naoPrevistoText}
                onChange={newValue => updateField('naoPrevistoText', newValue)}
                isEditing={isEditing}
                placeholder="Descreva o que não está previsto no fornecimento..."
              />
            </div>
          </div>

          {/* PROPOSTA slot — height only, no editable fields */}
          <div
            style={{
              height: (pageCounts['proposta'] ?? 1) * PAGE_SLOT_PX,
              flexShrink: 0,
            }}
          />

          {/* FATURAMENTO slot — fixed content, 2 pages, no controls */}
          <div
            style={{
              height: 2 * PAGE_SLOT_PX,
              flexShrink: 0,
            }}
          />

          {/* DE ACORDO slot — fixed content, no controls */}
          <div style={{ height: PAGE_SLOT_PX, flexShrink: 0 }} />
        </div>
      </div>

      {/* ── Right column — A4 pages ───────────────────────────────────────── */}
      <div
        className="document-a4-pages"
        style={{
          flex: 1,
          background: '#d1d5db',
          paddingTop: 24,
          paddingBottom: 24,
          minWidth: 0,
        }}
      >
        {/* Page 1: Cover */}
        <A4Page pageNumber={1} quoteNumber={quoteNumber}>
          <div
            style={{
              paddingTop: '55mm',
              fontSize: FONT_SIZE_TITLE,
              fontWeight: 'bold',
              textAlign: 'center',
              letterSpacing: '0.02em',
            }}
          >
            PROPOSTA PARA FORNECIMENTO
            <br />
            DE FÔRMA PRONTA
          </div>

          <SectionCallout
            text={`Nº PROPOSTA – ${quoteNumber}`}
            marginTop="23mm"
            padding="1mm"
            marginBottom="0"
          />

          <div style={{ marginTop: '20mm' }}>
            <FirstPageInfoElement
              rows={[
                { label: 'CLIENTE:', value: clientName, valueBold: true },
                { label: 'ENDEREÇO:', value: clientAddress },
              ]}
            />
            <FirstPageInfoElement
              rows={[
                { label: 'OBRA:', value: obraName, valueBold: true },
                { label: 'ENDEREÇO:', value: obraAddress },
              ]}
            />
            <FirstPageInfoElement
              rows={[
                { label: 'A.C.:', value: contactName, valueBold: true },
                { label: 'TEL.:', value: contactPhone },
                { label: 'E-MAIL:', value: contactEmail },
              ]}
            />
            <FirstPageInfoElement
              rows={[
                { label: 'VENDEDOR:', value: vendedorName, valueBold: true },
                { label: 'TEL.:', value: vendedorPhone },
                { label: 'E-MAIL:', value: vendedorEmail },
              ]}
            />
          </div>
        </A4Page>

        {/* Pages 2+: SUMÁRIO */}
        <PaginatedSection
          startPageNumber={2}
          quoteNumber={quoteNumber}
          onPageCountChange={count =>
            setPageCounts(prev =>
              prev['sumario'] === count ? prev : { ...prev, sumario: count },
            )
          }
        >
          <div
            style={{
              paddingTop: '5mm',
              fontSize: FONT_SIZE_TITLE,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            SUMÁRIO
          </div>
          {tocEntries.map(entry => (
            <TocEntryRow
              key={entry.title}
              title={entry.title}
              page={entry.page}
              level={entry.level ?? 1}
            />
          ))}
        </PaginatedSection>

        {/* HISTÓRICO */}
        <A4Page
          pageNumber={sectionStartPages['historico']}
          quoteNumber={quoteNumber}
        >
          <div
            style={{
              paddingTop: '10mm',
              fontSize: FONT_SIZE_TITLE,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            HISTÓRICO
          </div>
          <SectionCallout text="REVISÕES:" />
          <GrayTable
            rows={[
              {
                label: 'Nº REVISÃO',
                value: 'ALTERAÇÕES SOLICITADAS',
                valueBold: true,
              },
              ...revisions.map(revision => ({
                label: revision.label,
                value: revision.description,
              })),
            ]}
            marginTop="6mm"
            marginBottom="8mm"
          />
          <SectionCallout text="RESPONSÁVEIS TÉCNICOS" />
          <GrayTable
            marginTop="6mm"
            rows={[
              { label: 'ORÇAMENTISTA:', value: orcamentista },
              { label: 'REVISOR:', value: revisor },
              { label: 'APROVADO:', value: aprovado },
            ]}
          />
        </A4Page>

        {/* ESCOPO DE FORNECIMENTO */}
        <PaginatedSection
          startPageNumber={sectionStartPages['escopo']}
          quoteNumber={quoteNumber}
          onPageCountChange={count =>
            setPageCounts(prev =>
              prev['escopo'] === count ? prev : { ...prev, escopo: count },
            )
          }
        >
          <div
            style={{
              paddingTop: '10mm',
              fontSize: FONT_SIZE_TITLE,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            ESCOPO DE FORNECIMENTO
          </div>
          {richTextSectionChildren('APRESENTAÇÃO', apresentacaoText)}
          {richTextSectionChildren('ESCOPO DE ÁREAS', escopoAreasText)}
        </PaginatedSection>

        {/* DELIMITAÇÃO sections */}
        {delimitacaoSections.map(section => {
          const sectionKey = `delimitacao-${section.id}`
          return (
            <PaginatedSection
              key={section.id}
              startPageNumber={sectionStartPages[sectionKey]}
              quoteNumber={quoteNumber}
              contentAvailableHeightMm={215}
              onPageCountChange={count =>
                setPageCounts(previous =>
                  previous[sectionKey] === count
                    ? previous
                    : { ...previous, [sectionKey]: count },
                )
              }
            >
              <div
                style={{
                  paddingTop: '10mm',
                  fontSize: FONT_SIZE_TITLE,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                {section.title || 'DELIMITAÇÃO'}
              </div>
              <DelimitacaoLimitsTable section={section} />
              {section.selectedFileIds.map(fileId => (
                <DelimitacaoImageBlock
                  key={fileId}
                  fileId={fileId}
                  scale={section.fileScales?.[String(fileId)] ?? 100}
                  quoteFileContents={quoteFileContents}
                  onRequestFileContent={onRequestFileContent}
                />
              ))}
            </PaginatedSection>
          )
        })}

        {/* ÁREAS DE FORNECIMENTO — rendered in group order */}
        {resolvedAreaOrder.flatMap(group =>
          group.scopeIds
            .map((scopeId: number) => scopeMap.get(scopeId))
            .filter(
              (scope: QuoteScope | undefined): scope is QuoteScope =>
                scope !== undefined,
            )
            .map((scope: QuoteScope, indexInGroup: number) => {
              const calloutText =
                indexInGroup === 0 ? group.name : 'FORNECIMENTO COMPLEMENTAR'
              const scopeSectionKey = `areas-${scope.id}`
              const areasOverrides =
                (
                  (documentOptions.areasDeForecimento ?? {}) as Record<
                    string,
                    AreasDeFornecimentoScopeOverrides
                  >
                )[String(scope.id)] ?? {}
              const scopePageElements =
                derivedElementsByScope.get(scope.id!) ?? []
              return (
                <A4Page
                  key={scope.id}
                  pageNumber={sectionStartPages[scopeSectionKey]}
                  quoteNumber={quoteNumber}
                >
                  <AreasDeForecimentoPage
                    scope={scope}
                    scopePageElements={scopePageElements}
                    overrides={areasOverrides}
                    calloutText={calloutText}
                  />
                </A4Page>
              )
            }),
        )}

        {/* METRAGENS — one page summarising all group areas */}
        <A4Page
          pageNumber={sectionStartPages['metragens']}
          quoteNumber={quoteNumber}
        >
          <MetragensPage
            resolvedAreaOrder={resolvedAreaOrder}
            scopeMap={scopeMap}
            derivedElementsByScope={derivedElementsByScope}
          />
        </A4Page>

        {/* CONDIÇÕES GERAIS DE FORNECIMENTO */}
        <PaginatedSection
          startPageNumber={sectionStartPages['condicoesGerais']}
          quoteNumber={quoteNumber}
          onPageCountChange={count =>
            setPageCounts(prev => ({ ...prev, condicoesGerais: count }))
          }
          pageHeader={
            <>
              <div
                style={{
                  paddingTop: '10mm',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: FONT_SIZE_TITLE,
                  color: '#1a1a1a',
                }}
              >
                CONDIÇÕES GERAIS DE FORNECIMENTO
              </div>
              <SectionCallout text="PREVISTO:" marginBottom="0" />
            </>
          }
          contentContainerStyle={{
            borderLeft: '1px solid #1a1a1a',
            borderRight: '1px solid #1a1a1a',
            borderBottom: '1px solid #1a1a1a',
            padding: '0 4mm',
            marginBottom: '5mm',
          }}
          contentWatermark={
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{
                width: 220,
                height: 220,
                color: '#16a34a',
                opacity: 0.13,
              }}
            >
              <path
                fill="currentColor"
                d="M16.59 7.58L10 14.17l-3.59-3.58L5 12l5 5 8-8zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"
              />
            </svg>
          }
          contentContainerPaddingMm={8}
          contentAvailableHeightMm={205}
        >
          {splitHtmlToBlocks(condicoesGeraisText).map((block, blockIndex) => (
            <div
              key={blockIndex}
              className="document-rich-content"
              dangerouslySetInnerHTML={{ __html: block }}
            />
          ))}
        </PaginatedSection>

        <PaginatedSection
          startPageNumber={sectionStartPages['naoPrevisto']}
          quoteNumber={quoteNumber}
          onPageCountChange={count =>
            setPageCounts(prev => ({ ...prev, naoPrevisto: count }))
          }
          pageHeader={
            <>
              <div
                style={{
                  paddingTop: '10mm',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: FONT_SIZE_TITLE,
                  color: '#1a1a1a',
                }}
              >
                CONDIÇÕES GERAIS DE FORNECIMENTO
              </div>
              <SectionCallout text="NÃO PREVISTO:" marginBottom="0" />
            </>
          }
          contentContainerStyle={{
            borderLeft: '1px solid #1a1a1a',
            borderRight: '1px solid #1a1a1a',
            borderBottom: '1px solid #1a1a1a',
            padding: '0 4mm',
            marginBottom: '5mm',
          }}
          contentWatermark={
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{
                width: 220,
                height: 220,
                color: '#dc2626',
                opacity: 0.13,
              }}
            >
              <path
                fill="currentColor"
                d="M14.59 8L12 10.59 9.41 8 8 9.41 10.59 12 8 14.59 9.41 16 12 13.41 14.59 16 16 14.59 13.41 12 16 9.41 14.59 8zM12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
              />
            </svg>
          }
          contentContainerPaddingMm={8}
          contentAvailableHeightMm={210}
        >
          {splitHtmlToBlocks(naoPrevistoText).map((block, blockIndex) => (
            <div
              key={blockIndex}
              className="document-rich-content"
              dangerouslySetInnerHTML={{ __html: block }}
            />
          ))}
        </PaginatedSection>

        <PropostaPage
          pageNumber={sectionStartPages['proposta'] ?? 0}
          quoteNumber={quoteNumber}
          allElements={allDerivedAndComputedElements}
          scopes={scopes}
          selectedPricingOption={selectedPricingOption}
        />

        <FaturamentoPage
          pageNumber={sectionStartPages['faturamento']}
          quoteNumber={quoteNumber}
        />
        <DeAcordoPage
          pageNumber={sectionStartPages['deAcordo']}
          quoteNumber={quoteNumber}
        />
      </div>
    </div>
  )
}
