import React, { useEffect, useRef, useState } from 'react'
import { FiTrash2 } from 'react-icons/fi'
import { FillableCell } from './FillableCell'
import type { Product } from 'types/product'
import type { QuoteElementType } from '@novadmin/lib/types'
import {
  toLocalDecimal,
  parseLocalizedNumber,
} from '@novadmin/lib/utils/unitConversion'
import type { EditableElementField, ManagedQuoteElement } from './shared'
import {
  applyFieldUpdate,
  disabledFieldClasses,
  enabledFieldClasses,
  getComputedFieldValue,
} from './shared'

const focusAdjacentRow = (
  currentTarget: HTMLElement,
  columnId: string,
  direction: 1 | -1,
) => {
  const table = currentTarget.closest('table')
  const currentRowIndex = Number(currentTarget.dataset.rowIndex)
  if (!table || Number.isNaN(currentRowIndex)) return

  const targetRowIndex = currentRowIndex + direction
  const nextField = table.querySelector<HTMLElement>(
    `[data-column-id="${columnId}"][data-row-index="${targetRowIndex}"]`,
  )
  nextField?.focus()
}

const handleVerticalEnterNavigation = (
  event: React.KeyboardEvent<HTMLElement>,
  columnId: string,
) => {
  if (event.key !== 'Enter') return

  event.preventDefault()

  const currentTarget = event.currentTarget
  if (
    currentTarget instanceof HTMLInputElement &&
    currentTarget.type === 'checkbox'
  ) {
    // Enter just toggles the checkbox — it does not move focus.
    if (!currentTarget.disabled) currentTarget.click()
    return
  }

  focusAdjacentRow(currentTarget, columnId, event.shiftKey ? -1 : 1)
}

type LocaleNumberInputProps = {
  value: number | string
  placeholder: string
  disabled: boolean
  className: string
  rowIndex: number
  columnId: string
  onChange: (value: number) => void
}

function LocaleNumberInput({
  value,
  placeholder,
  disabled,
  className,
  rowIndex,
  columnId,
  onChange,
}: LocaleNumberInputProps) {
  const toLocal = (v: number | string): string => {
    if (v === '' || v == null) return ''
    const n = Number(v)
    return Number.isNaN(n) ? '' : toLocalDecimal(n)
  }

  const [localValue, setLocalValue] = useState<string>(toLocal(value))
  const commitRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFocusedRef = useRef(false)

  // Sync from parent only when not focused (avoids overwriting mid-typing)
  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalValue(toLocal(value))
    }
  }, [value])

  useEffect(() => {
    return () => {
      if (commitRef.current) clearTimeout(commitRef.current)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setLocalValue(raw)
    if (commitRef.current) clearTimeout(commitRef.current)
    commitRef.current = setTimeout(() => {
      onChange(raw === '' ? 0 : parseLocalizedNumber(raw))
    }, 180)
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      placeholder={placeholder}
      value={localValue}
      disabled={disabled}
      onChange={handleChange}
      data-row-index={rowIndex}
      data-column-id={columnId}
      onKeyDown={event => handleVerticalEnterNavigation(event, columnId)}
      onFocus={() => {
        isFocusedRef.current = true
      }}
      onBlur={() => {
        isFocusedRef.current = false
        // If there's no edit of our own still pending, resync display value
        // from the latest external value (e.g. a fill-drag that landed on
        // this field while it was focused, which the sync effect above
        // skipped). If our own edit IS still pending, let its debounce
        // commit naturally instead of flashing back to the stale prop value.
        if (!commitRef.current) {
          setLocalValue(toLocal(value))
        }
      }}
    />
  )
}

interface QuoteElementRowProps {
  element: ManagedQuoteElement
  rowIndex: number
  type: QuoteElementType
  isEditing: boolean
  scopeId?: number
  productOptions: Product[]
  showSelectionCheckbox?: boolean
  showScopeColumn?: boolean
  onRemoveElement: (localId: string) => void
  onDraftChange: (localId: string, element: ManagedQuoteElement) => void
  onCommitDraft: (localId: string, element: ManagedQuoteElement) => void
}

export const QuoteElementRow = React.memo(function QuoteElementRow({
  element,
  rowIndex,
  type,
  isEditing,
  scopeId,
  productOptions,
  showSelectionCheckbox = false,
  showScopeColumn = false,
  onRemoveElement,
  onDraftChange,
  onCommitDraft,
}: QuoteElementRowProps) {
  const [draftElement, setDraftElement] = useState(element)

  useEffect(() => {
    setDraftElement(element)
  }, [element])

  useEffect(() => {
    onDraftChange(element.localId, draftElement)

    const timeoutId = setTimeout(() => {
      onCommitDraft(element.localId, draftElement)
    }, 180)

    return () => clearTimeout(timeoutId)
  }, [draftElement, element.localId, onCommitDraft, onDraftChange])

  const updateDraft = (field: EditableElementField, value: any) => {
    setDraftElement(previous =>
      applyFieldUpdate(previous, field, value, type, productOptions),
    )
  }

  const disabled = !isEditing

  const renderNumericInput = (
    field: string,
    placeholder: string,
    className = 'w-full p-2 rounded border',
  ) => (
    <LocaleNumberInput
      value={draftElement.values?.[field] ?? ''}
      placeholder={placeholder}
      disabled={disabled}
      rowIndex={rowIndex}
      columnId={`values.${field}`}
      className={`${className} ${
        disabled
          ? disabledFieldClasses
          : `${enabledFieldClasses} focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent`
      }`}
      onChange={next => updateDraft('values', { [field]: next })}
    />
  )

  const renderComputedNumericInput = (field: string, placeholder: string) => {
    const computedValue = getComputedFieldValue(
      draftElement.type,
      field,
      draftElement.values || {},
    )

    return (
      <input
        type="text"
        className={`w-full rounded border p-2 ${disabledFieldClasses}`}
        placeholder={placeholder}
        value={toLocalDecimal(computedValue)}
        disabled
        readOnly
      />
    )
  }

  const renderFillableNumericCell = (field: string, placeholder: string) => (
    <FillableCell
      columnId={`values.${field}`}
      rowIndex={rowIndex}
      value={draftElement.values?.[field]}
      disabled={disabled}
      className="px-2 py-1"
    >
      {renderNumericInput(field, placeholder)}
    </FillableCell>
  )

  return (
    <tr className="align-top rounded bg-gray-50">
      {isEditing && showSelectionCheckbox && (
        <FillableCell
          columnId="scopeId"
          rowIndex={rowIndex}
          value={draftElement.scopeId != null}
          disabled={disabled}
          className="px-2 py-1 text-center align-middle"
        >
          <input
            type="checkbox"
            checked={draftElement.scopeId != null}
            disabled={
              draftElement.scopeId != null && draftElement.scopeId !== scopeId
            }
            onChange={event =>
              updateDraft(
                'scopeId',
                event.target.checked ? scopeId ?? null : null,
              )
            }
            data-row-index={rowIndex}
            data-column-id="scopeId"
            onKeyDown={event => handleVerticalEnterNavigation(event, 'scopeId')}
            className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 disabled:cursor-not-allowed"
          />
        </FillableCell>
      )}
      <FillableCell
        columnId="productId"
        rowIndex={rowIndex}
        value={draftElement.productId}
        disabled={disabled}
        className="w-[15%] px-2 py-1 align-top"
      >
        <select
          className={`w-full rounded border p-2 ${
            disabled ? disabledFieldClasses : enabledFieldClasses
          }`}
          value={draftElement.productId?.toString() || ''}
          disabled={disabled}
          onChange={event =>
            updateDraft(
              'productId',
              event.target.value ? Number(event.target.value) : 0,
            )
          }
          data-row-index={rowIndex}
          data-column-id="productId"
          onKeyDown={event => handleVerticalEnterNavigation(event, 'productId')}
        >
          <option value="">Selecionar</option>
          {productOptions.map(product => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </FillableCell>
      <FillableCell
        columnId="name"
        rowIndex={rowIndex}
        value={draftElement.name}
        disabled={disabled}
        className="px-2 py-1 align-top"
      >
        <input
          type="text"
          className={`w-full rounded border p-2 ${
            disabled ? disabledFieldClasses : enabledFieldClasses
          }`}
          value={draftElement.name || ''}
          disabled={disabled}
          onChange={event =>
            updateDraft('name', event.target.value.toUpperCase())
          }
          data-row-index={rowIndex}
          data-column-id="name"
          onKeyDown={event => handleVerticalEnterNavigation(event, 'name')}
        />
      </FillableCell>

      {type === 'pilar' && (
        <>
          {renderFillableNumericCell('fundoCm', 'Fundo')}
          {renderFillableNumericCell('lateralCm', 'Lateral')}
          {renderFillableNumericCell('peDireitoM', 'Pé Direito')}
          {renderFillableNumericCell('quantidade', 'Quantidade')}
          <td className="px-2 py-1">
            {renderComputedNumericInput('metragemM2', 'Metragem')}
          </td>
          <FillableCell
            columnId="values.needsGastalho"
            rowIndex={rowIndex}
            value={Boolean(draftElement.values?.needsGastalho)}
            disabled={disabled}
            className="px-2 py-1 text-center align-middle"
          >
            <input
              type="checkbox"
              checked={Boolean(draftElement.values?.needsGastalho)}
              disabled={disabled}
              onChange={event =>
                updateDraft('values', {
                  needsGastalho: event.target.checked,
                })
              }
              data-row-index={rowIndex}
              data-column-id="values.needsGastalho"
              onKeyDown={event =>
                handleVerticalEnterNavigation(event, 'values.needsGastalho')
              }
              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 disabled:cursor-not-allowed"
            />
          </FillableCell>
        </>
      )}

      {type === 'viga' && (
        <>
          {renderFillableNumericCell('fundoCm', 'Fundo')}
          {renderFillableNumericCell('alturaLajeLateralACm', 'H Lat. A')}
          {renderFillableNumericCell('alturaLajeLateralBCm', 'H Lat. B')}
          {renderFillableNumericCell('lateralCm', 'Lateral')}
          {renderFillableNumericCell('comprimentoCm', 'Comprimento')}
          <td className="px-2 py-1">
            {renderComputedNumericInput('fundoDeVigaM2', 'M2 Fdv')}
          </td>
          <td className="px-2 py-1">
            {renderComputedNumericInput('lateralDeVigaM2', 'M2 LV')}
          </td>
          <FillableCell
            columnId="values.tipo"
            rowIndex={rowIndex}
            value={draftElement.values?.tipo || 'interno'}
            disabled={disabled}
            className="min-w-[120px] px-2 py-1"
          >
            <select
              className={`w-full min-w-[120px] rounded border p-2 pr-8 ${
                disabled ? disabledFieldClasses : enabledFieldClasses
              }`}
              value={draftElement.values?.tipo || 'interno'}
              disabled={disabled}
              onChange={event =>
                updateDraft('values', {
                  tipo: event.target.value,
                })
              }
              data-row-index={rowIndex}
              data-column-id="values.tipo"
              onKeyDown={event =>
                handleVerticalEnterNavigation(event, 'values.tipo')
              }
            >
              <option value="interno">Interno</option>
              <option value="borda">Borda</option>
            </select>
          </FillableCell>
          <FillableCell
            columnId="values.needsGarfo"
            rowIndex={rowIndex}
            value={Boolean(draftElement.values?.needsGarfo)}
            disabled={disabled}
            className="px-2 py-1 text-center align-middle"
          >
            <input
              type="checkbox"
              checked={Boolean(draftElement.values?.needsGarfo)}
              disabled={disabled}
              onChange={event =>
                updateDraft('values', {
                  needsGarfo: event.target.checked,
                })
              }
              data-row-index={rowIndex}
              data-column-id="values.needsGarfo"
              onKeyDown={event =>
                handleVerticalEnterNavigation(event, 'values.needsGarfo')
              }
              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 disabled:cursor-not-allowed"
            />
          </FillableCell>
        </>
      )}

      {type === 'laje' && (
        <>
          {renderFillableNumericCell('areaM2', 'Área')}
          {renderFillableNumericCell('perimetroM', 'Perímetro')}
          {renderFillableNumericCell('fechamentoM2', 'Fechamentos')}
          <td className="px-2 py-1">
            {renderComputedNumericInput('faixasAdicionaisM2', 'Faixas ADC')}
          </td>
          <td className="px-2 py-1">
            {renderComputedNumericInput('metragemM2', 'Metragem')}
          </td>
        </>
      )}

      {showScopeColumn && (
        <td className="w-[18%] whitespace-nowrap px-2 py-1 align-middle text-sm text-gray-600">
          {element.scope?.name ?? '-'}
        </td>
      )}

      {isEditing ? (
        <td className="px-2 py-1 text-center">
          <button
            type="button"
            onClick={() => onRemoveElement(element.localId)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
            title="Remover linha"
          >
            <FiTrash2 />
          </button>
        </td>
      ) : null}
    </tr>
  )
})
