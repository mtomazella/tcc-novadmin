import {
  appendElementDerivedValues,
  defaultValuesByType,
  modifierFieldsByType,
} from '@novadmin/lib/quote/elements'
import type { QuoteElementType } from '@novadmin/lib/types'
import type { QuoteElementApiItem } from 'types/quote'
import type { Product } from 'types/product'

export type ManagedQuoteElement = Omit<QuoteElementApiItem, 'values'> & {
  localId: string
  values: Record<string, any>
}

export type EditableElementField =
  | 'productId'
  | 'name'
  | 'scopeId'
  | 'type'
  | 'values'

export const sectionLabels: Record<QuoteElementType, string> = {
  pilar: 'Pilares',
  viga: 'Vigas',
  laje: 'Lajes',
}

export const preferredProductNamesByType: Record<QuoteElementType, string[]> = {
  pilar: ['pilar', 'pilares'],
  viga: ['viga', 'vigas'],
  laje: ['laje', 'lajes'],
}

export const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

export const pickDefaultProductForType = (
  type: QuoteElementType,
  products: Product[],
) => {
  const preferredNames = preferredProductNamesByType[type].map(normalizeText)

  return (
    products.find(product =>
      preferredNames.includes(normalizeText(product.name || '')),
    ) || products[0]
  )
}

export const modifierLabelByField: Record<string, string> = {
  cambotado: 'Cambotado',
  needsGastalho: 'Necessita Gastalho',
  needsGarfo: 'Necessita Garfo',
  ripado: 'Ripado',
  aparente: 'Aparente',
  paginado: 'Paginado',
}

export const disabledFieldClasses =
  'bg-white text-gray-500 border-gray-200 cursor-not-allowed opacity-100'

export const enabledFieldClasses = 'bg-white text-gray-700 border-gray-300'

export const normalizeNumericValue = (value: any) => {
  if (value === '' || value === null || value === undefined) {
    return 0
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

export const getComputedFieldValue = (
  type: QuoteElementType,
  field: string,
  values: Record<string, any>,
) => {
  const derivedElement = appendElementDerivedValues({
    type,
    values,
  } as any)

  return (derivedElement.values as Record<string, any>)[field] ?? 0
}

export const isNewElementInDefaultState = (element: ManagedQuoteElement) => {
  if (element.id) return false

  const defaultValues = defaultValuesByType[element.type]
  const currentValues = element.values || {}

  const hasDefaultValuesOnly =
    Object.entries(defaultValues).every(
      ([key, value]) =>
        currentValues[key] == null || currentValues[key] === value,
    ) &&
    Object.keys(currentValues).every(key => {
      if (key in defaultValues) {
        return (
          currentValues[key] ===
          defaultValues[key as keyof typeof defaultValues]
        )
      }

      return currentValues[key] == null || currentValues[key] === ''
    })

  const hasEmptyName = !element.name?.trim()
  const hasEmptyScope = element.scopeId == null

  return hasDefaultValuesOnly && hasEmptyName && hasEmptyScope
}

export const applyFieldUpdate = (
  element: ManagedQuoteElement,
  field: EditableElementField,
  value: any,
  type: QuoteElementType,
  productOptions: Product[],
): ManagedQuoteElement => {
  if (field === 'values') {
    return {
      ...element,
      values: {
        ...element.values,
        ...value,
      },
    }
  }

  if (field === 'productId') {
    const product = productOptions.find(p => Number(p.id) === value)
    const modifierValues: Record<string, boolean> = {}
    if (product?.modifiers) {
      for (const modField of modifierFieldsByType[type]) {
        modifierValues[modField] = Boolean(
          product.modifiers[modField as keyof typeof product.modifiers],
        )
      }
    }
    return {
      ...element,
      productId: value,
      values: {
        ...element.values,
        ...modifierValues,
      },
    }
  }

  return {
    ...element,
    [field]: value,
  }
}
