import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import ElementsEditor from './elements/ElementsEditor'

interface ElementsTabProps {
  quoteId: number
  isElementsLocked?: boolean
  isElementsLockedByAnotherUser?: boolean
  onDirtyStateChange?: (isDirty: boolean) => void
  readOnly?: boolean
}

export interface TabLeaveGuardHandle {
  isDirty: () => boolean
  saveBeforeLeave: () => Promise<boolean>
  discardBeforeLeave: () => Promise<boolean>
}

const ElementsTab = forwardRef<TabLeaveGuardHandle, ElementsTabProps>(
  function ElementsTab(
    { quoteId, onDirtyStateChange, readOnly }: ElementsTabProps,
    ref,
  ) {
    const [isDirty, setIsDirty] = useState(false)
    const [unassignedElementsCount, setUnassignedElementsCount] = useState(0)
    const elementsEditorRef =
      useRef<import('./elements/ElementsEditor').ElementsEditorHandle>(null)

    useImperativeHandle(
      ref,
      () => ({
        isDirty: () => isDirty,
        saveBeforeLeave: async () => {
          if (!isDirty || !elementsEditorRef.current?.isEditing()) {
            return true
          }
          return await (elementsEditorRef.current?.saveElements() ?? false)
        },
        discardBeforeLeave: async () => {
          if (!isDirty) {
            return true
          }
          return await (elementsEditorRef.current?.cancelEditMode() ?? false)
        },
      }),
      [isDirty, elementsEditorRef],
    )

    return (
      <div className="space-y-5 rounded-lg bg-white p-4 shadow-sm">
        {unassignedElementsCount > 0 && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {unassignedElementsCount === 1
              ? '1 elemento não está associado a um escopo e não será considerado nos custos.'
              : `${unassignedElementsCount} elementos não estão associados a um escopo e não serão considerados nos custos.`}
          </div>
        )}
        <ElementsEditor
          ref={elementsEditorRef}
          quoteId={quoteId}
          onDirtyStateChange={dirty => {
            setIsDirty(dirty)
            onDirtyStateChange?.(dirty)
          }}
          onUnassignedElementsChange={setUnassignedElementsCount}
          readOnly={readOnly}
        />
      </div>
    )
  },
)

export default ElementsTab
