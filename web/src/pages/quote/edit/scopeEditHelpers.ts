import type {
  MaterialType,
  Quote,
  QuoteElement,
  QuoteElementType,
  QuoteFixedCost,
  QuoteFixedCostValueType,
  QuoteGroupedElement,
  QuoteProductConsumption,
  QuoteScopeMaterialSelection,
  QuoteScopeMaterialSelectionElementType,
  QuoteScopeMaterialSnapshot,
  QuoteScopeMaterialSnapshotMap,
} from '@novadmin/lib/types'
import { MaterialTypes } from '@novadmin/lib/types'
import {
  appendElementDerivedValues,
  defaultValuesByType,
} from '@novadmin/lib/quote/elements'
import { getMaterialSelectionKey } from '@novadmin/lib/quote/materials'
import {
  getOverriddenFixedCosts,
  getOverriddenProductConsumption,
} from '@novadmin/lib/quote/overrides'
import {
  centsToReais,
  reaisToCents,
  decimalToPercent,
  toLocalDecimal,
  formatCurrency,
  normalizeNumber,
} from '@novadmin/lib/utils/unitConversion'
import type {
  QuoteValuesTableColumn,
  QuoteValuesTableRowType,
} from 'components/QuoteValuesTable'
import type { QuoteElementApiItem, QuoteScopeApiItem } from 'types/quote'
import type { Material } from 'types/supplier'
import type { Product } from 'types/product'
import type { ManagedQuoteElement } from './elements/shared'

export type EditableQuoteScope = Omit<
  QuoteScopeApiItem,
  'materials' | 'materialSelections'
> & {
  materialSelections: QuoteScopeMaterialSelection[]
}

export type MaterialTableRow = {
  _id: string
  _rowType: QuoteValuesTableRowType
  elementLabel: string
  currentSku: string
  suppliersForSku: Array<{ supplierName: string; materialId: number }>
  materialId: number
  quantity: number
  unitValueOriginal: number | null
  overrideValueInput: number | ''
  category: string
  materialType: MaterialType
}

export type EditableFixedCostRow = {
  id: string
  name: string
  description: string
  valueType: QuoteFixedCostValueType
  originalValue: number | null
  value: number | ''
}

export type EditableProductConsumptionRow = {
  category: string
  elementLabel: string
  commercialPercentage: number | ''
  projectPercentage: number | ''
  icChapa1: number | ''
  icRipa1: number | ''
  icChapa2: number | ''
  icRipa2: number | ''
  icChapa3: number | ''
  icRipa3: number | ''
  _placeholder?: Record<string, string>
}

export const sectionOrder: QuoteElementType[] = ['pilar', 'viga', 'laje']

export const materialTypeLabels: Record<MaterialType, string> = {
  chapa: 'Materiais - Chapas',
  ripa: 'Materiais - Ripa',
  chapa_especial: 'Materiais - Chapas - Painéis Especiais',
  ripa_especial: 'Materiais - Ripa - Painéis Especiais',
}

const createLocalId = (type: QuoteElementType, index: number) =>
  `${type}-${index}-${Date.now()}`

export const buildDraftSnapshot = (items: ManagedQuoteElement[]) =>
  Object.fromEntries(items.map(item => [item.localId, item]))

export const sanitizeValuesForType = (
  type: QuoteElementType,
  values: Record<string, unknown>,
) => {
  const allowedKeys = new Set(Object.keys(defaultValuesByType[type]))
  return Object.entries(values || {}).reduce((acc, [k, v]) => {
    if (allowedKeys.has(k)) acc[k] = v
    return acc
  }, {} as Record<string, unknown>)
}

export const applyComputedElementValues = (
  type: QuoteElementType,
  values: Record<string, unknown>,
) => {
  const derived = appendElementDerivedValues({ type, values } as Parameters<
    typeof appendElementDerivedValues
  >[0])
  return derived.values as Record<string, unknown>
}

export const isNewElementInDefaultState = (element: ManagedQuoteElement) => {
  if (element.id) return false
  const defaults = defaultValuesByType[element.type]
  const vals = element.values || {}
  const hasDefaultOnly =
    Object.entries(defaults).every(([k, v]) => vals[k] === v) &&
    Object.keys(vals).every(k =>
      !(k in defaults)
        ? vals[k] == null || vals[k] === ''
        : vals[k] === defaults[k],
    )
  return hasDefaultOnly && !element.name?.trim() && element.scopeId == null
}

export const toManagedElements = (
  items: QuoteElementApiItem[],
): ManagedQuoteElement[] =>
  items.map((item, i) => ({
    ...item,
    localId: createLocalId(item.type as QuoteElementType, i),
    values: (item.values || {}) as Record<string, unknown>,
  }))

export const deriveSelectionsFromElements = (
  elements: QuoteElement[],
  existingSelections: QuoteScopeMaterialSelection[],
): QuoteScopeMaterialSelection[] => {
  const existingByKey = new Map(
    existingSelections.map(s => [
      getMaterialSelectionKey({
        materialType: s.materialType,
        category: s.category,
      }),
      s,
    ]),
  )

  const combos = new Map<string, QuoteScopeMaterialSelection>()

  for (const element of elements) {
    const category = element.category ?? ''
    if (!category) continue
    for (const materialType of MaterialTypes) {
      const key = getMaterialSelectionKey({ materialType, category })
      if (combos.has(key)) continue
      combos.set(
        key,
        existingByKey.get(key) ?? {
          elementType: element.type as QuoteScopeMaterialSelectionElementType,
          category,
          materialType,
          materialId: 0,
          overrides: {},
        },
      )
    }
  }

  return Array.from(combos.values())
}

export const fromMaterialCatalog = (
  material: Material,
): QuoteScopeMaterialSnapshot => ({
  id: Number(material.id),
  supplierId: Number(material.supplierId),
  sku: material.sku,
  name: material.name,
  description: material.description,
  type: material.type as QuoteScopeMaterialSnapshot['type'],
  value: normalizeNumber(material.value),
})

export const buildMaterialSnapshot = (
  materialSelections: QuoteScopeMaterialSelection[],
  catalog: Material[],
  existing: QuoteScopeMaterialSnapshotMap,
): QuoteScopeMaterialSnapshotMap => {
  const referenced = new Set(
    materialSelections.map(s => String(s.materialId)).filter(id => id !== '0'),
  )
  const catalogById = new Map(catalog.map(m => [String(m.id), m]))
  const next: QuoteScopeMaterialSnapshotMap = {}
  for (const id of referenced) {
    next[id] =
      existing[id] ??
      (catalogById.get(id)
        ? fromMaterialCatalog(catalogById.get(id)!)
        : undefined!)
  }
  return next
}

export const toFixedCostRows = (
  baseCosts: QuoteFixedCost[],
  quote: Quote | null,
  scope: Pick<EditableQuoteScope, 'overriddenFixedCosts'>,
): EditableFixedCostRow[] => {
  const effectiveAtQuote = quote
    ? getOverriddenFixedCosts({
        fixedCosts: baseCosts,
        quote,
        overrideLevel: 'quote',
      })
    : baseCosts

  const toDisplay = (raw: number, type: QuoteFixedCostValueType): number =>
    type === 'price'
      ? centsToReais(normalizeNumber(raw))
      : decimalToPercent(normalizeNumber(raw))

  return baseCosts.map(baseCost => {
    const effective =
      effectiveAtQuote.find(c => c.id === baseCost.id) ?? baseCost
    const scopeOverride = (scope.overriddenFixedCosts || []).find(
      c => c.id === baseCost.id,
    )
    return {
      id: baseCost.id,
      name: baseCost.name,
      description: baseCost.description ?? '',
      valueType: baseCost.valueType as QuoteFixedCostValueType,
      originalValue: toDisplay(
        effective.value,
        baseCost.valueType as QuoteFixedCostValueType,
      ),
      value:
        scopeOverride != null
          ? toDisplay(
              scopeOverride.value,
              baseCost.valueType as QuoteFixedCostValueType,
            )
          : '',
    }
  })
}

const toConsumptionValue = (raw: number | null | undefined): number | '' =>
  raw == null ? '' : normalizeNumber(raw)

export const toProductConsumptionRows = (
  scope: Pick<EditableQuoteScope, 'overriddenProductConsumption'>,
): EditableProductConsumptionRow[] =>
  (scope.overriddenProductConsumption || []).map(item => ({
    category: item.category ?? String(item.id),
    elementLabel: item.category ?? String(item.id),
    commercialPercentage:
      item.commercialPercentage == null
        ? ''
        : decimalToPercent(normalizeNumber(item.commercialPercentage)),
    projectPercentage:
      item.projectPercentage == null
        ? ''
        : decimalToPercent(normalizeNumber(item.projectPercentage)),
    icChapa1: toConsumptionValue(item.consumptionRates.icChapa1),
    icRipa1: toConsumptionValue(item.consumptionRates.icRipa1),
    icChapa2: toConsumptionValue(item.consumptionRates.icChapa2),
    icRipa2: toConsumptionValue(item.consumptionRates.icRipa2),
    icChapa3: toConsumptionValue(item.consumptionRates.icChapa3),
    icRipa3: toConsumptionValue(item.consumptionRates.icRipa3),
  }))

export const deriveProductConsumptionFromGroups = (
  groups: Record<string, QuoteGroupedElement>,
  existingOverrides: QuoteProductConsumption[],
  products: Product[],
  quote: Quote | null,
): EditableProductConsumptionRow[] => {
  const overridesByCategory = new Map(
    existingOverrides.filter(o => o.category).map(o => [o.category!, o]),
  )
  const productsById = new Map(products.map(p => [String(p.id), p]))
  return Object.entries(groups)
    .filter(([key]) => key)
    .map(([key, group]) => {
      const override = overridesByCategory.get(key)
      const productId = String(group.elements[0]?.productId)
      const product = productsById.get(productId)
      const placeholder: Record<string, string> = {}
      if (product) {
        const quoteLevel = getOverriddenProductConsumption({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          product: product as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          quote: (quote as any) ?? undefined,
          overrideLevel: quote ? 'quote' : 'product',
        })

        if (quoteLevel.commercialPercentage != null)
          placeholder.commercialPercentage = toLocalDecimal(
            decimalToPercent(normalizeNumber(quoteLevel.commercialPercentage)),
          )
        if (quoteLevel.projectPercentage != null)
          placeholder.projectPercentage = toLocalDecimal(
            decimalToPercent(normalizeNumber(quoteLevel.projectPercentage)),
          )
        if (quoteLevel.consumptionRates.icChapa1 != null)
          placeholder.icChapa1 = toLocalDecimal(
            normalizeNumber(quoteLevel.consumptionRates.icChapa1),
          )
        if (quoteLevel.consumptionRates.icRipa1 != null)
          placeholder.icRipa1 = toLocalDecimal(
            normalizeNumber(quoteLevel.consumptionRates.icRipa1),
          )
        if (quoteLevel.consumptionRates.icChapa2 != null)
          placeholder.icChapa2 = toLocalDecimal(
            normalizeNumber(quoteLevel.consumptionRates.icChapa2),
          )
        if (quoteLevel.consumptionRates.icRipa2 != null)
          placeholder.icRipa2 = toLocalDecimal(
            normalizeNumber(quoteLevel.consumptionRates.icRipa2),
          )
        if (quoteLevel.consumptionRates.icChapa3 != null)
          placeholder.icChapa3 = toLocalDecimal(
            normalizeNumber(quoteLevel.consumptionRates.icChapa3),
          )
        if (quoteLevel.consumptionRates.icRipa3 != null)
          placeholder.icRipa3 = toLocalDecimal(
            normalizeNumber(quoteLevel.consumptionRates.icRipa3),
          )
      }
      return {
        category: key,
        elementLabel: group.categoryName || group.category || key,
        commercialPercentage:
          override?.commercialPercentage == null
            ? ''
            : decimalToPercent(normalizeNumber(override.commercialPercentage)),
        projectPercentage:
          override?.projectPercentage == null
            ? ''
            : decimalToPercent(normalizeNumber(override.projectPercentage)),
        icChapa1: toConsumptionValue(override?.consumptionRates?.icChapa1),
        icRipa1: toConsumptionValue(override?.consumptionRates?.icRipa1),
        icChapa2: toConsumptionValue(override?.consumptionRates?.icChapa2),
        icRipa2: toConsumptionValue(override?.consumptionRates?.icRipa2),
        icChapa3: toConsumptionValue(override?.consumptionRates?.icChapa3),
        icRipa3: toConsumptionValue(override?.consumptionRates?.icRipa3),
        _placeholder: Object.keys(placeholder).length ? placeholder : undefined,
      }
    })
}

export const resolveEffectiveConsumptionPercentages = (
  groups: Record<string, QuoteGroupedElement>,
  products: Product[],
  quote: Quote | null,
  scope?: Pick<EditableQuoteScope, 'overriddenProductConsumption'> | null,
): Array<{
  category: string
  commercialPercentage: number | null
  projectPercentage: number | null
}> => {
  const productsById = new Map(products.map(p => [String(p.id), p]))
  const overrideLevel = scope ? 'scope' : quote ? 'quote' : 'product'
  return Object.entries(groups).map(([category, group]) => {
    const productId = String(group.elements[0]?.productId)
    const product = productsById.get(productId)
    if (!product)
      return { category, commercialPercentage: null, projectPercentage: null }
    const { commercialPercentage, projectPercentage } =
      getOverriddenProductConsumption({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        product: product as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        quote: (quote as any) ?? undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scope: (scope as any) ?? undefined,
        overrideLevel,
      })
    return { category, commercialPercentage, projectPercentage }
  })
}

export const toPersistableScope = (
  draft: EditableQuoteScope,
  materials: QuoteScopeMaterialSnapshotMap,
): EditableQuoteScope => {
  const {
    createdAt,
    updatedAt,
    deletedAt,
    isLocked,
    lockedByUserId,
    lockedAt,
    isLockedByAnotherUser,
    timeLocked,
    isTimeout,
    timeLockedReadable,
    ...rest
  } = draft as EditableQuoteScope & Record<string, unknown>
  return {
    ...rest,
    materials,
    materialSelections: draft.materialSelections,
    overriddenProductConsumption: (rest.overriddenProductConsumption ?? []).map(
      item => ({
        ...item,
        commercialPercentage: item.commercialPercentage ?? undefined,
        projectPercentage: item.projectPercentage ?? undefined,
        consumptionRates: Object.fromEntries(
          Object.entries(item.consumptionRates).map(([k, v]) => [
            k,
            v ?? undefined,
          ]),
        ),
      }),
    ),
  } as unknown as EditableQuoteScope
}

export const getUniqueSkusForType = (
  catalog: Material[],
  type: MaterialType,
): Array<{ name: string; sku: string }> => {
  const seen = new Set<string>()
  const result: Array<{ name: string; sku: string }> = []
  for (const m of catalog) {
    if (m.type === type && !seen.has(m.sku)) {
      seen.add(m.sku)
      result.push({ name: m.name, sku: m.sku })
    }
  }
  return result.sort((a, b) => a.name.localeCompare(b.name))
}

export const getSuppliersForSku = (
  catalog: Material[],
  sku: string,
  type: MaterialType,
): Array<{ supplierName: string; materialId: number }> =>
  catalog
    .filter(m => m.type === type && m.sku === sku)
    .map(m => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supplierName: (m as any).supplier?.name ?? `Fornecedor ${m.supplierId}`,
      materialId: Number(m.id),
    }))

// ─── Column definitions ──────────────────────────────────────────────────────

export const fixedCostColumns: QuoteValuesTableColumn<EditableFixedCostRow>[] =
  [
    { key: 'name', label: 'Elemento', field: 'name' },
    { key: 'description', label: 'Especificações', field: 'description' },
    {
      key: 'value',
      label: 'Valor',
      field: 'value',
      inputType: 'number',
      editable: true,
      align: 'left',
      precision: 2,
      prefix: (row: EditableFixedCostRow) =>
        row.valueType === 'price' ? 'R$' : undefined,
      suffix: (row: EditableFixedCostRow) =>
        row.valueType === 'percentage' ? '%' : undefined,
      placeholder: (row: EditableFixedCostRow) =>
        row.originalValue != null
          ? toLocalDecimal(row.originalValue, 2)
          : undefined,
      formatter: (value: number | '', row: EditableFixedCostRow) => {
        const effective = value !== '' ? value : row.originalValue
        if (effective == null) return null
        return row.valueType === 'price'
          ? formatCurrency(reaisToCents(effective as number))
          : `${toLocalDecimal(effective as number)}%`
      },
    },
  ]

const consumptionPlaceholder =
  (field: string) => (row: EditableProductConsumptionRow) =>
    row._placeholder?.[field]

export const productConsumptionColumns: QuoteValuesTableColumn<EditableProductConsumptionRow>[] =
  [
    { key: 'elementLabel', label: 'Elemento', field: 'elementLabel' },
    {
      key: 'commercialPercentage',
      label: 'Comercial %',
      field: 'commercialPercentage',
      inputType: 'number',
      editable: true,
      align: 'left',
      suffix: '%',
      placeholder: consumptionPlaceholder('commercialPercentage'),
      formatter: (value: number | '') =>
        value === '' || value == null
          ? null
          : `${toLocalDecimal(value as number)}%`,
    },
    {
      key: 'projectPercentage',
      label: 'Projeto %',
      field: 'projectPercentage',
      inputType: 'number',
      editable: true,
      align: 'left',
      suffix: '%',
      placeholder: consumptionPlaceholder('projectPercentage'),
      formatter: (value: number | '') =>
        value === '' || value == null
          ? null
          : `${toLocalDecimal(value as number)}%`,
    },
    {
      key: 'icChapa1',
      label: 'I.C. Chapa',
      field: 'icChapa1',
      inputType: 'number',
      editable: true,
      align: 'left',
      suffix: 'm2/ch',
      placeholder: consumptionPlaceholder('icChapa1'),
    },
    {
      key: 'icRipa1',
      label: 'I.C. Ripa',
      field: 'icRipa1',
      inputType: 'number',
      editable: true,
      align: 'left',
      suffix: 'm3/m2',
      placeholder: consumptionPlaceholder('icRipa1'),
    },
    {
      key: 'icChapa2',
      label: 'I.C. Chapa Especial',
      field: 'icChapa2',
      inputType: 'number',
      editable: true,
      align: 'left',
      suffix: 'm2/ch',
      placeholder: consumptionPlaceholder('icChapa2'),
    },
    {
      key: 'icRipa2',
      label: 'I.C. Ripa Especial',
      field: 'icRipa2',
      inputType: 'number',
      editable: true,
      align: 'left',
      suffix: 'm3/m2',
      placeholder: consumptionPlaceholder('icRipa2'),
    },
  ]
