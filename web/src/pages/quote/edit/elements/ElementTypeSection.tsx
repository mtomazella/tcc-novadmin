import React, { useMemo } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import type { Product } from 'types/product'
import type { QuoteElementType } from '@novadmin/lib/types'
import type { ManagedQuoteElement } from './shared'
import { QuoteElementRow } from './QuoteElementRow'
import { FillDragProvider } from './FillDragProvider'
import { sectionLabels } from './shared'
import ToggleButtonGroup from 'components/ToggleButtonGroup'

interface ElementTypeSectionProps {
  type: QuoteElementType
  sectionElements: ManagedQuoteElement[]
  isCollapsed: boolean
  isEditing: boolean
  scopeId?: number
  productOptions: Product[]
  useFilter?: boolean
  filter?: 'todos' | 'inclusos'
  showSelectionCheckbox?: boolean
  showScopeColumn?: boolean
  onFilterChange?: (filter: 'todos' | 'inclusos') => void
  onToggleCollapse: (type: QuoteElementType) => void
  onRemoveElement: (localId: string) => void
  onDraftChange: (localId: string, element: ManagedQuoteElement) => void
  onCommitDraft: (localId: string, element: ManagedQuoteElement) => void
  onCommitDraftBatch: (
    updates: Array<{ localId: string; element: ManagedQuoteElement }>,
  ) => void
}

export const ElementTypeSection = React.memo(function ElementTypeSection({
  type,
  sectionElements,
  isCollapsed,
  isEditing,
  scopeId,
  productOptions,
  useFilter = false,
  filter,
  showSelectionCheckbox = false,
  showScopeColumn = false,
  onFilterChange,
  onToggleCollapse,
  onRemoveElement,
  onDraftChange,
  onCommitDraft,
  onCommitDraftBatch,
}: ElementTypeSectionProps) {
  const tableContent = useMemo(() => {
    return (
      <div className="overflow-x-auto">
        <FillDragProvider
          type={type}
          sectionElements={sectionElements}
          productOptions={productOptions}
          scopeId={scopeId}
          onCommitDraftBatch={onCommitDraftBatch}
        >
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {isEditing && showSelectionCheckbox && (
                  <th className="px-2 py-1 text-center">Incluso</th>
                )}
                <th className="px-2 py-1">Produto</th>
                <th className="px-2 py-1">Número</th>
                {type === 'pilar' && (
                  <>
                    <th className="px-2 py-1">Fundo (cm)</th>
                    <th className="px-2 py-1">Lateral (cm)</th>
                    <th className="px-2 py-1">Pé Direito (m)</th>
                    <th className="px-2 py-1">Quantidade</th>
                    <th className="px-2 py-1">Metragem (m2)</th>
                    <th className="px-2 py-1 text-center">Gastalho</th>
                  </>
                )}
                {type === 'viga' && (
                  <>
                    <th className="px-2 py-1">Fundo (cm)</th>
                    <th className="px-2 py-1">H Laje - Lat. A (cm)</th>
                    <th className="px-2 py-1">H Laje - Lat. B (cm)</th>
                    <th className="px-2 py-1">Lateral (cm)</th>
                    <th className="px-2 py-1">Comprimento (cm)</th>
                    <th className="px-2 py-1">M2 Fdv (m2)</th>
                    <th className="px-2 py-1">M2 LV (m2)</th>
                    <th className="min-w-[120px] px-2 py-1">Tipo</th>
                    <th className="px-2 py-1 text-center">Garfo</th>
                  </>
                )}
                {type === 'laje' && (
                  <>
                    <th className="px-2 py-1">Área (m2)</th>
                    <th className="px-2 py-1">Perímetro (m)</th>
                    <th className="px-2 py-1">Fechamentos (m2)</th>
                    <th className="px-2 py-1">Faixas ADC (m2)</th>
                    <th className="px-2 py-1">Metragem (m2)</th>
                  </>
                )}
                {showScopeColumn && <th className="px-2 py-1">Escopo</th>}
                {isEditing ? (
                  <th className="px-2 py-1 text-center">Ações</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {sectionElements.map((element, rowIndex) => (
                <QuoteElementRow
                  key={element.localId}
                  element={element}
                  rowIndex={rowIndex}
                  type={type}
                  isEditing={isEditing}
                  scopeId={scopeId}
                  productOptions={productOptions}
                  showSelectionCheckbox={showSelectionCheckbox}
                  showScopeColumn={showScopeColumn}
                  onRemoveElement={onRemoveElement}
                  onDraftChange={onDraftChange}
                  onCommitDraft={onCommitDraft}
                />
              ))}
            </tbody>
          </table>
        </FillDragProvider>
      </div>
    )
  }, [
    isEditing,
    scopeId,
    productOptions,
    sectionElements,
    showScopeColumn,
    type,
    onCommitDraft,
    onCommitDraftBatch,
    onDraftChange,
    onRemoveElement,
  ])

  return (
    <section className="rounded border border-gray-200 p-4">
      <div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => onToggleCollapse(type)}
          className="flex flex-1 items-center gap-2 rounded px-1 py-1 text-left text-gray-800 hover:bg-gray-50"
        >
          <FiChevronDown
            className={`transition-transform duration-200 ${
              isCollapsed ? '-rotate-90' : 'rotate-0'
            }`}
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {sectionLabels[type]}
            </h2>
            <p className="text-sm text-gray-500">
              {sectionElements.length} elemento(s)
            </p>
          </div>
        </button>
        {useFilter && filter !== undefined && onFilterChange && (
          <ToggleButtonGroup
            options={[
              { value: 'inclusos', label: 'Inclusos' },
              { value: 'todos', label: 'Todos' },
            ]}
            value={filter}
            onChange={onFilterChange}
          />
        )}
      </div>

      <div className={isCollapsed ? 'hidden' : 'overflow-x-auto'}>
        {tableContent}
      </div>
    </section>
  )
})
