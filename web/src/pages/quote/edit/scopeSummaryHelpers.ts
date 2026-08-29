import type {
  QuoteElementType,
  QuoteGroupedElement,
  QuoteScopeMaterialSelectionElementType,
  QuoteElementModifier,
} from '@novadmin/lib/types'
import { roundToTwo } from '@novadmin/lib/utils/unitConversion'
import type {
  QuoteValuesTableColumn,
  QuoteValuesTableRowType,
} from 'components/QuoteValuesTable'
import { modifierLabelByField, sectionLabels } from './elements/shared'

export type ScopeSummaryRow = {
  _rowType?: QuoteValuesTableRowType
  id: string
  element: string
  quantity: number
  survey: string
  commercial: string
  project: string
}

export const scopeSummaryColumns: QuoteValuesTableColumn<ScopeSummaryRow>[] = [
  { key: 'element', label: 'Elemento', field: 'element' },
  { key: 'quantity', label: 'Quantidade', field: 'quantity', align: 'center' },
  { key: 'survey', label: 'Levantamento', field: 'survey', align: 'center' },
  {
    key: 'commercial',
    label: 'Levantamento Comercial',
    field: 'commercial',
    align: 'center',
  },
  {
    key: 'project',
    label: 'Levantamento de Projeto',
    field: 'project',
    align: 'center',
  },
]

const modifierFields = Object.keys(
  modifierLabelByField,
) as QuoteElementModifier[]

export const extractSelectionModifiers = (
  type: QuoteElementType,
  values: Record<string, unknown>,
): Record<QuoteElementModifier, boolean> => ({
  cambotado: type !== 'laje' ? Boolean(values.cambotado) : false,
  ripado: Boolean(values.ripado),
  aparente: Boolean(values.aparente),
  paginado: Boolean(values.paginado),
  needsGastalho: type === 'pilar' ? Boolean(values.needsGastalho) : false,
  needsGarfo: type === 'viga' ? Boolean(values.needsGarfo) : false,
  garfo: type === 'outro' ? Boolean(values.garfo) : false,
  gastalho: type === 'outro' ? Boolean(values.gastalho) : false,
  fundoDeViga: type === 'outro' ? Boolean(values.fundoDeViga) : false,
})

export const selectionLabel = (
  elementType: QuoteScopeMaterialSelectionElementType,
  modifiers: Record<QuoteElementModifier, boolean>,
  productName?: string,
) => {
  const labels = modifierFields
    .filter(f => modifiers[f])
    .map(f => modifierLabelByField[f] ?? String(f))
  const base =
    productName || sectionLabels[elementType as QuoteElementType] || elementType
  return labels.length === 0 ? base : `${base} (${labels.join(', ')})`
}

export const toScopeSummaryRows = (
  groups: Record<string, QuoteGroupedElement>,
): ScopeSummaryRow[] => {
  const rows: ScopeSummaryRow[] = Object.entries(groups)
    .filter(([key]) => key)
    .map(([key, group]) => {
      const totalM2 = group.totalM2 ?? 0
      const commercialM2 = group.commercialTotalM2 ?? totalM2
      const projectM2 = group.projectTotalM2 ?? totalM2
      const label = group.categoryName || group.category || key
      return {
        id: key,
        element: label,
        quantity: roundToTwo(group.quantity),
        survey: `${roundToTwo(totalM2).toLocaleString('pt-BR')} m2`,
        commercial: `${roundToTwo(commercialM2).toLocaleString('pt-BR')} m2`,
        project: `${roundToTwo(projectM2).toLocaleString('pt-BR')} m2`,
      }
    })

  const totalQuantity = rows.reduce((s, r) => s + r.quantity, 0)
  const totalM2 = Object.values(groups).reduce(
    (s, g) => s + (g.totalM2 ?? 0),
    0,
  )
  const totalCommercialM2 = Object.values(groups).reduce(
    (s, g) => s + (g.commercialTotalM2 ?? g.totalM2 ?? 0),
    0,
  )
  const totalProjectM2 = Object.values(groups).reduce(
    (s, g) => s + (g.projectTotalM2 ?? g.totalM2 ?? 0),
    0,
  )

  return [
    ...rows,
    {
      _rowType: 'footer',
      id: 'total',
      element: 'Total',
      quantity: roundToTwo(totalQuantity),
      survey: `${roundToTwo(totalM2).toLocaleString('pt-BR')} m2`,
      commercial: `${roundToTwo(totalCommercialM2).toLocaleString('pt-BR')} m2`,
      project: `${roundToTwo(totalProjectM2).toLocaleString('pt-BR')} m2`,
    },
  ]
}
