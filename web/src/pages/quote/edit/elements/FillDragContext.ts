import { createContext, useContext } from 'react'

export type FillDragState = {
  columnId: string
  startRowIndex: number
  currentRowIndex: number
} | null

export interface FillDragContextValue {
  dragState: FillDragState
  startDrag: (columnId: string, rowIndex: number, sourceValue: unknown) => void
  hoverRow: (columnId: string, rowIndex: number) => void
}

export const FillDragContext = createContext<FillDragContextValue | null>(null)

export const useFillDrag = (): FillDragContextValue => {
  const context = useContext(FillDragContext)
  if (!context) {
    throw new Error('useFillDrag must be used within a FillDragProvider')
  }
  return context
}
