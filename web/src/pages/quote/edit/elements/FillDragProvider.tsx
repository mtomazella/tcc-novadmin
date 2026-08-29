import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { QuoteElementType } from '@novadmin/lib/types'
import type { Product } from 'types/product'
import { FillDragContext } from './FillDragContext'
import type { FillDragState } from './FillDragContext'
import { applyFieldUpdate, isNewElementInDefaultState } from './shared'
import type { EditableElementField, ManagedQuoteElement } from './shared'

interface FillDragProviderProps {
  type: QuoteElementType
  sectionElements: ManagedQuoteElement[]
  productOptions: Product[]
  scopeId?: number
  onCommitDraftBatch: (
    updates: Array<{ localId: string; element: ManagedQuoteElement }>,
  ) => void
  children: ReactNode
}

const parseValuesColumnId = (columnId: string): string | null =>
  columnId.startsWith('values.') ? columnId.slice('values.'.length) : null

export function FillDragProvider({
  type,
  sectionElements,
  productOptions,
  scopeId,
  onCommitDraftBatch,
  children,
}: FillDragProviderProps) {
  const [dragState, setDragState] = useState<FillDragState>(null)
  const dragStateRef = useRef<FillDragState>(null)
  const sourceValueRef = useRef<unknown>(null)
  const sectionElementsRef = useRef(sectionElements)
  sectionElementsRef.current = sectionElements

  const setDrag = useCallback((next: FillDragState) => {
    dragStateRef.current = next
    setDragState(next)
  }, [])

  const endDrag = useCallback(
    (commit: boolean) => {
      const current = dragStateRef.current

      if (commit && current) {
        const { columnId, startRowIndex, currentRowIndex } = current
        const sourceValue = sourceValueRef.current
        const rangeStart = Math.min(startRowIndex, currentRowIndex)
        const rangeEnd = Math.max(startRowIndex, currentRowIndex)
        const elements = sectionElementsRef.current
        const nestedKey = parseValuesColumnId(columnId)
        const updates: Array<{
          localId: string
          element: ManagedQuoteElement
        }> = []

        for (let rowIndex = rangeStart; rowIndex <= rangeEnd; rowIndex++) {
          if (rowIndex === startRowIndex) continue
          const targetElement = elements[rowIndex]
          if (!targetElement) continue
          if (isNewElementInDefaultState(targetElement)) continue

          if (columnId === 'scopeId') {
            const isLockedToOtherScope =
              targetElement.scopeId != null && targetElement.scopeId !== scopeId
            if (isLockedToOtherScope) continue

            const nextScopeId = sourceValue ? scopeId ?? null : null
            updates.push({
              localId: targetElement.localId,
              element: { ...targetElement, scopeId: nextScopeId },
            })
            continue
          }

          const field = (
            nestedKey ? 'values' : columnId
          ) as EditableElementField
          const updatedElement = applyFieldUpdate(
            targetElement,
            field,
            nestedKey ? { [nestedKey]: sourceValue } : sourceValue,
            type,
            productOptions,
          )
          updates.push({
            localId: targetElement.localId,
            element: updatedElement,
          })
        }

        onCommitDraftBatch(updates)
      }

      sourceValueRef.current = null
      setDrag(null)
    },
    [onCommitDraftBatch, productOptions, scopeId, setDrag, type],
  )

  const isDragging = dragState !== null

  useEffect(() => {
    if (!isDragging) return undefined

    const handleMouseUp = () => endDrag(true)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') endDrag(false)
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.userSelect = 'none'

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.userSelect = ''
    }
  }, [isDragging, endDrag])

  const startDrag = useCallback(
    (columnId: string, rowIndex: number, sourceValue: unknown) => {
      sourceValueRef.current = sourceValue
      setDrag({
        columnId,
        startRowIndex: rowIndex,
        currentRowIndex: rowIndex,
      })
    },
    [setDrag],
  )

  const hoverRow = useCallback(
    (columnId: string, rowIndex: number) => {
      const current = dragStateRef.current
      if (!current || current.columnId !== columnId) return
      if (current.currentRowIndex === rowIndex) return
      setDrag({ ...current, currentRowIndex: rowIndex })
    },
    [setDrag],
  )

  return (
    <FillDragContext.Provider value={{ dragState, startDrag, hoverRow }}>
      {children}
    </FillDragContext.Provider>
  )
}
