import {
  computeProductionCostPerM2,
  type CostSummaryResult,
} from '@novadmin/lib/quote/costSummary'
import {
  decimalToPercent,
  formatCurrency,
  toLocalDecimal,
} from '@novadmin/lib/utils/unitConversion'
import QuoteValuesTable, {
  type QuoteValuesTableColumn,
  type QuoteValuesTableRowType,
} from 'components/QuoteValuesTable'

const formatPercent = (v: number) =>
  `${toLocalDecimal(decimalToPercent(v), 1)}%`
const formatCents = (cents: number) => formatCurrency(Math.round(cents))
const formatM2 = (v: number) => `${toLocalDecimal(v, 2)} m²`
const formatQuantity = (v: number) => `${toLocalDecimal(v, 0)} un`

// ── Custos Fixos ──────────────────────────────────────────────────────────────

type FixedCostSummaryRow = {
  _id: string
  _rowType: QuoteValuesTableRowType
  element: string
  base: string
  value: string
  percentage: string
}

const fixedCostSummaryColumns: QuoteValuesTableColumn<FixedCostSummaryRow>[] = [
  { key: 'element', label: 'Elemento', field: 'element' },
  { key: 'base', label: 'Base', field: 'base', align: 'right' },
  { key: 'value', label: 'Valor', field: 'value', align: 'right' },
  {
    key: 'percentage',
    label: 'Percentual',
    field: 'percentage',
    align: 'right',
    width: 110,
  },
]

// ── Custos Variáveis ──────────────────────────────────────────────────────────

type VariableCostSummaryRow = {
  _id: string
  _rowType: QuoteValuesTableRowType
  element: string
  valuePerM2: string
  rate: string
  value: string
  percentage: string
}

const variableCostSummaryColumns: QuoteValuesTableColumn<VariableCostSummaryRow>[] =
  [
    { key: 'element', label: 'Elemento', field: 'element' },
    {
      key: 'valuePerM2',
      label: 'Custo Total',
      field: 'valuePerM2',
      align: 'right',
    },
    { key: 'rate', label: 'Taxa %', field: 'rate', align: 'right', width: 100 },
    { key: 'value', label: 'Valor', field: 'value', align: 'right' },
    {
      key: 'percentage',
      label: 'Percentual',
      field: 'percentage',
      align: 'right',
      width: 110,
    },
  ]

// ── Resumo de Custos ──────────────────────────────────────────────────────────

type CostResumeRow = {
  _id: string
  _rowType: QuoteValuesTableRowType
  element: string
  value: string
  percentage: string
  costPerM2Label: string
  costPerM2Value: string
}

const costResumeColumns: QuoteValuesTableColumn<CostResumeRow>[] = [
  { key: 'element', label: 'Elemento', field: 'element' },
  {
    key: 'costPerM2Label',
    label: '',
    field: 'costPerM2Label',
    align: 'right',
    formatter: (value: string) => value,
  },
  {
    key: 'costPerM2Value',
    label: '',
    field: 'costPerM2Value',
    align: 'left',
    formatter: (value: string) => value,
  },
  { key: 'value', label: 'Valor', field: 'value', align: 'right' },
  {
    key: 'percentage',
    label: 'Percentual',
    field: 'percentage',
    align: 'right',
    width: 110,
  },
]

// ── Resumo de Preços ──────────────────────────────────────────────────────────

type PriceSummaryRow = {
  _id: string
  _rowType: QuoteValuesTableRowType
  element: string
  quantity: string
  unitValue: string
  value: string
  percentage: string
}

const priceSummaryColumns: QuoteValuesTableColumn<PriceSummaryRow>[] = [
  { key: 'element', label: 'Elemento', field: 'element' },
  { key: 'quantity', label: 'Quantidade', field: 'quantity', align: 'right' },
  { key: 'unitValue', label: 'Valor Un.', field: 'unitValue', align: 'right' },
  { key: 'value', label: 'Valor', field: 'value', align: 'right' },
  {
    key: 'percentage',
    label: 'Percentual',
    field: 'percentage',
    align: 'right',
    width: 110,
  },
]

// ── Main component ────────────────────────────────────────────────────────────

interface CostSummarySectionProps {
  costSummary: CostSummaryResult
}

export default function CostSummarySection({
  costSummary,
}: CostSummarySectionProps) {
  // ── Table 1: Custos Fixos ───────────────────────────────────────────────────

  const fixedCostBodyRows = costSummary.fixedCostItems.map(item => ({
    _id: item.id,
    _rowType: 'body' as QuoteValuesTableRowType,
    element: item.name,
    base: item.base !== null ? formatM2(item.base) : '-',
    value: formatCents(item.value),
    percentage: formatPercent(item.percentage),
  }))
  const fixedCostRows: FixedCostSummaryRow[] = [
    ...fixedCostBodyRows,
    ...(fixedCostBodyRows.length > 0
      ? [
          {
            _id: '__fixed_total',
            _rowType: 'footer' as QuoteValuesTableRowType,
            element: 'Total',
            base: '',
            value: formatCents(costSummary.fixedCostTotal),
            percentage: '100%',
          },
        ]
      : []),
  ]

  // ── Table 2: Custos Variáveis ───────────────────────────────────────────────

  const variableCostBodyRows = costSummary.variableCostItems.map(item => ({
    _id: item.id,
    _rowType: 'body' as QuoteValuesTableRowType,
    element: item.name,
    valuePerM2: formatCents(item.basePricingTotal),
    rate: formatPercent(item.rate),
    value: formatCents(item.value),
    percentage: formatPercent(item.percentage),
  }))
  const variableCostRows: VariableCostSummaryRow[] = [
    ...variableCostBodyRows,
    ...(variableCostBodyRows.length > 0
      ? [
          {
            _id: '__variable_total',
            _rowType: 'footer' as QuoteValuesTableRowType,
            element: 'Total',
            valuePerM2: '',
            rate: '',
            value: formatCents(costSummary.variableCostTotal),
            percentage: '100%',
          },
        ]
      : []),
  ]

  // ── Table 3: Resumo de Custos ───────────────────────────────────────────────

  const grandCostTotal =
    costSummary.fixedCostTotal + costSummary.variableCostTotal
  const productionCostPerM2 = computeProductionCostPerM2(costSummary)
  const costResumeRows: CostResumeRow[] = [
    {
      _id: 'fixed',
      _rowType: 'body',
      element: 'Fixo',
      value: formatCents(costSummary.fixedCostTotal),
      percentage:
        grandCostTotal > 0
          ? formatPercent(costSummary.fixedCostTotal / grandCostTotal)
          : '-',
      costPerM2Label: '',
      costPerM2Value: '',
    },
    {
      _id: 'variable',
      _rowType: 'body',
      element: 'Variável',
      value: formatCents(costSummary.variableCostTotal),
      percentage:
        grandCostTotal > 0
          ? formatPercent(costSummary.variableCostTotal / grandCostTotal)
          : '-',
      costPerM2Label: '',
      costPerM2Value: '',
    },
    {
      _id: 'total',
      _rowType: 'footer',
      element: 'Total',
      value: formatCents(grandCostTotal),
      percentage: '100%',
      costPerM2Label: 'Custo M2 Produção',
      costPerM2Value:
        costSummary.totalM2 > 0 ? formatCents(productionCostPerM2) : '-',
    },
  ]

  // ── Table 4: Resumo de Preços ───────────────────────────────────────────────

  const pricingTotal = costSummary.pricingGrandTotal
  const pricingBodyRows: PriceSummaryRow[] = [
    {
      _id: 'reto',
      _rowType: 'body',
      element: 'Reto',
      quantity: formatM2(costSummary.totalM2Reto),
      unitValue:
        costSummary.pricingTotalReto > 0 && costSummary.totalM2Reto > 0
          ? formatCents(costSummary.pricingTotalReto / costSummary.totalM2Reto)
          : '-',
      value: formatCents(costSummary.pricingTotalReto),
      percentage:
        pricingTotal > 0
          ? formatPercent(costSummary.pricingTotalReto / pricingTotal)
          : '-',
    },
    {
      _id: 'cambotado',
      _rowType: 'body',
      element: 'Cambotado',
      quantity: formatM2(costSummary.totalM2Cambotado),
      unitValue:
        costSummary.pricingTotalCambotado > 0 &&
        costSummary.totalM2Cambotado > 0
          ? formatCents(
              costSummary.pricingTotalCambotado / costSummary.totalM2Cambotado,
            )
          : '-',
      value: formatCents(costSummary.pricingTotalCambotado),
      percentage:
        pricingTotal > 0
          ? formatPercent(costSummary.pricingTotalCambotado / pricingTotal)
          : '-',
    },
    {
      _id: 'garfo',
      _rowType: 'body',
      element: 'Garfo',
      quantity: formatQuantity(costSummary.totalGarfoQuantity),
      unitValue:
        costSummary.pricingTotalGarfo > 0 && costSummary.totalGarfoQuantity > 0
          ? formatCents(
              costSummary.pricingTotalGarfo / costSummary.totalGarfoQuantity,
            )
          : '-',
      value: formatCents(costSummary.pricingTotalGarfo),
      percentage:
        pricingTotal > 0
          ? formatPercent(costSummary.pricingTotalGarfo / pricingTotal)
          : '-',
    },
  ]
  const pricingSummaryRows: PriceSummaryRow[] = [
    ...pricingBodyRows,
    ...(pricingBodyRows.length > 0
      ? [
          {
            _id: '__pricing_total',
            _rowType: 'footer' as QuoteValuesTableRowType,
            element: 'Total',
            quantity: formatM2(costSummary.totalM2),
            unitValue: '',
            value: formatCents(pricingTotal),
            percentage: '100%',
          },
        ]
      : []),
  ]

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Custos Fixos</h2>
        <QuoteValuesTable<FixedCostSummaryRow>
          columns={fixedCostSummaryColumns}
          rows={fixedCostRows}
          rowIdField="_id"
          getRowType={row => row._rowType}
          emptyText="Nenhum custo fixo calculado."
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Custos Variáveis</h2>
        <QuoteValuesTable<VariableCostSummaryRow>
          columns={variableCostSummaryColumns}
          rows={variableCostRows}
          rowIdField="_id"
          getRowType={row => row._rowType}
          emptyText="Nenhum custo variável calculado."
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Resumo de Custos</h2>
        <QuoteValuesTable<CostResumeRow>
          columns={costResumeColumns}
          rows={costResumeRows}
          rowIdField="_id"
          getRowType={row => row._rowType}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Resumo de Preços</h2>
        <QuoteValuesTable<PriceSummaryRow>
          columns={priceSummaryColumns}
          rows={pricingSummaryRows}
          rowIdField="_id"
          getRowType={row => row._rowType}
          emptyText="Nenhum preço calculado."
        />
      </section>
    </>
  )
}
