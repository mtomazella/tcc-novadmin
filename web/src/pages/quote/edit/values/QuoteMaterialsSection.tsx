import { useState } from 'react'
import type { MaterialType } from '@novadmin/lib/types'
import type {
  QuoteMaterialAggregatedEntry,
  QuoteMaterialEntry,
} from '@novadmin/lib/quote/materials'
import { aggregateMaterialEntriesByCategory } from '@novadmin/lib/quote/materials'
import {
  formatCurrency,
  toLocalDecimal,
} from '@novadmin/lib/utils/unitConversion'
import QuoteValuesTable, {
  type QuoteValuesTableColumn,
  type QuoteValuesTableRowType,
} from 'components/QuoteValuesTable'
import ToggleButtonGroup from 'components/ToggleButtonGroup'

type MaterialSummaryRow = {
  _id: string
  _rowType: QuoteValuesTableRowType
  scope: string
  specifications: string
  element: string
  measurement: string
  quantity: string
  unitValue: string
  value: string
}

const scopeColumns: QuoteValuesTableColumn<MaterialSummaryRow>[] = [
  { key: 'scope', label: 'Escopo', field: 'scope' },
  { key: 'specifications', label: 'Especificações', field: 'specifications' },
  { key: 'element', label: 'Elemento', field: 'element' },
  {
    key: 'measurement',
    label: 'Metragem',
    field: 'measurement',
    align: 'right',
  },
  {
    key: 'quantity',
    label: 'Quantidade',
    field: 'quantity',
    align: 'right',
    width: 110,
  },
  {
    key: 'unitValue',
    label: 'Valor unitário',
    field: 'unitValue',
    align: 'right',
  },
  { key: 'value', label: 'Valor', field: 'value', align: 'right' },
]

const quoteColumns: QuoteValuesTableColumn<MaterialSummaryRow>[] = [
  { key: 'element', label: 'Elemento', field: 'element' },
  {
    key: 'measurement',
    label: 'Metragem',
    field: 'measurement',
    align: 'right',
  },
  {
    key: 'quantity',
    label: 'Quantidade',
    field: 'quantity',
    align: 'right',
    width: 110,
  },
  { key: 'value', label: 'Valor', field: 'value', align: 'right' },
]

const materialsDisplayLabels: Record<MaterialType, string> = {
  chapa: 'Compensados',
  chapa_especial: 'Compensados — Painéis Especiais',
  ripa: 'Madeira Serrada',
  ripa_especial: 'Madeira Serrada — Painéis Especiais',
}

const materialTypeOrder: MaterialType[] = [
  'chapa',
  'chapa_especial',
  'ripa',
  'ripa_especial',
]

const formatQuantity = (quantity: number | null): string => {
  if (quantity === null) return '—'
  return toLocalDecimal(Math.round(quantity * 100) / 100)
}

function buildRows(
  entries: QuoteMaterialEntry[],
  materialType: MaterialType,
): MaterialSummaryRow[] {
  const filtered = entries.filter(e => e.materialType === materialType)
  const quantityUnit =
    materialType === 'ripa' || materialType === 'ripa_especial' ? 'm³' : 'un'

  const rows: MaterialSummaryRow[] = filtered.map(e => ({
    _id: `${e.scopeId}-${e.category}-${e.materialType}`,
    _rowType: 'body',
    scope: e.scopeName,
    specifications: e.materialName,
    element: e.categoryName ?? e.category,
    measurement: `${toLocalDecimal(e.totalM2, 2)} m²`,
    quantity: formatQuantity(e.quantity),
    unitValue: `${formatCurrency(e.unitValue)}/${quantityUnit}`,
    value: e.totalValue !== null ? formatCurrency(e.totalValue) : '—',
  }))

  if (filtered.length > 0) {
    const totalM2 = filtered.reduce((acc, e) => acc + e.totalM2, 0)
    const totalQty = filtered.reduce((acc, e) => acc + (e.quantity ?? 0), 0)
    const totalValue = filtered.reduce((acc, e) => acc + (e.totalValue ?? 0), 0)
    rows.push({
      _id: `footer-${materialType}`,
      _rowType: 'footer',
      scope: '',
      specifications: '',
      element: 'Total',
      measurement: `${toLocalDecimal(totalM2, 2)} m²`,
      quantity: formatQuantity(totalQty),
      unitValue: '',
      value: formatCurrency(totalValue),
    })
  }

  return rows
}

function buildAggregatedRows(
  aggregated: QuoteMaterialAggregatedEntry[],
  materialType: MaterialType,
): MaterialSummaryRow[] {
  const filtered = aggregated.filter(e => e.materialType === materialType)

  const rows: MaterialSummaryRow[] = filtered.map(e => ({
    _id: `quote-${e.category}-${e.materialType}`,
    _rowType: 'body',
    scope: '',
    specifications: '',
    element: e.categoryName ?? e.category,
    measurement: `${toLocalDecimal(e.totalM2, 2)} m²`,
    quantity: formatQuantity(e.quantity),
    unitValue: '',
    value: e.totalValue !== null ? formatCurrency(e.totalValue) : '—',
  }))

  if (filtered.length > 0) {
    const totalM2 = filtered.reduce((acc, e) => acc + e.totalM2, 0)
    const totalQty = filtered.reduce((acc, e) => acc + (e.quantity ?? 0), 0)
    const totalValue = filtered.reduce((acc, e) => acc + (e.totalValue ?? 0), 0)
    rows.push({
      _id: `quote-footer-${materialType}`,
      _rowType: 'footer',
      scope: '',
      specifications: '',
      element: 'Total',
      measurement: `${toLocalDecimal(totalM2, 2)} m²`,
      quantity: formatQuantity(totalQty),
      unitValue: '',
      value: formatCurrency(totalValue),
    })
  }

  return rows
}

type ViewMode = 'scope' | 'quote'

const viewModeOptions: { value: ViewMode; label: string }[] = [
  { value: 'scope', label: 'Escopo' },
  { value: 'quote', label: 'Orçamento' },
]

interface QuoteMaterialsSectionProps {
  entries: QuoteMaterialEntry[]
}

export default function QuoteMaterialsSection({
  entries,
}: QuoteMaterialsSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('scope')
  const aggregated = aggregateMaterialEntriesByCategory(entries)

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Materiais</h2>
        <ToggleButtonGroup
          options={viewModeOptions}
          value={viewMode}
          onChange={setViewMode}
        />
      </div>

      {materialTypeOrder.map(materialType => (
        <div key={materialType} className="space-y-2">
          <h3 className="text-base font-medium text-gray-700">
            {materialsDisplayLabels[materialType]}
          </h3>
          <QuoteValuesTable<MaterialSummaryRow>
            columns={viewMode === 'scope' ? scopeColumns : quoteColumns}
            rows={
              viewMode === 'scope'
                ? buildRows(entries, materialType)
                : buildAggregatedRows(aggregated, materialType)
            }
            rowIdField="_id"
            getRowType={row => row._rowType}
            emptyText="Nenhum material calculado."
          />
        </div>
      ))}
    </section>
  )
}
