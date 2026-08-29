import type { ReactNode } from 'react'
import { useFillDrag } from './FillDragContext'

interface FillableCellProps {
  columnId: string
  rowIndex: number
  value: unknown
  disabled: boolean
  className: string
  children: ReactNode
}

export function FillableCell({
  columnId,
  rowIndex,
  value,
  disabled,
  className,
  children,
}: FillableCellProps) {
  const { dragState, startDrag, hoverRow } = useFillDrag()

  const isInRange =
    dragState !== null &&
    dragState.columnId === columnId &&
    rowIndex >= Math.min(dragState.startRowIndex, dragState.currentRowIndex) &&
    rowIndex <= Math.max(dragState.startRowIndex, dragState.currentRowIndex)

  return (
    <td
      className={`group relative ${className} ${
        isInRange ? 'ring-2 ring-inset ring-blue-400' : ''
      }`}
      onMouseEnter={() => hoverRow(columnId, rowIndex)}
    >
      {children}
      {!disabled && (
        <button
          type="button"
          aria-label="Arrastar para copiar valor"
          tabIndex={-1}
          className="absolute bottom-0 right-0 hidden h-2.5 w-2.5 cursor-crosshair border border-white bg-blue-500 group-hover:block"
          onMouseDown={event => {
            event.preventDefault()
            event.stopPropagation()
            startDrag(columnId, rowIndex, value)
          }}
        />
      )}
    </td>
  )
}
