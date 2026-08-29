import React from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

interface PreviewControlsProps {
  isCollapsed: boolean
  onToggle: () => void
  isEditing: boolean
  isSaving: boolean
  isDocumentLockedByAnotherUser: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onExportPdf: () => void
  onExportDocx: () => void
  readOnly?: boolean
}

export default function PreviewControls({
  isCollapsed,
  onToggle,
  isEditing,
  isSaving,
  isDocumentLockedByAnotherUser,
  onEdit,
  onSave,
  onCancel,
  onExportPdf,
  onExportDocx,
  readOnly,
}: PreviewControlsProps) {
  return (
    <div className="preview-controls-panel sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2">
      <button
        type="button"
        onClick={onToggle}
        title={isCollapsed ? 'Expandir painel' : 'Recolher painel'}
        className="rounded p-1 text-gray-500 hover:bg-gray-100"
      >
        {isCollapsed ? (
          <FiChevronRight size={16} />
        ) : (
          <FiChevronLeft size={16} />
        )}
      </button>

      {isDocumentLockedByAnotherUser && (
        <span className="rounded border border-yellow-300 bg-yellow-50 px-2 py-0.5 text-xs text-yellow-800">
          Bloqueado por outro usuário
        </span>
      )}

      <div className="flex-1" />

      {isEditing ? (
        <>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="rounded bg-violet-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? 'Salvando…' : 'Salvar'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancelar
          </button>
        </>
      ) : !readOnly ? (
        <button
          type="button"
          onClick={onEdit}
          disabled={isDocumentLockedByAnotherUser}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Editar
        </button>
      ) : null}

      <div className="h-4 w-px bg-gray-200" />

      <button
        type="button"
        onClick={onExportPdf}
        className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
      >
        PDF
      </button>
      <button
        type="button"
        onClick={onExportDocx}
        className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
      >
        DOCX
      </button>
    </div>
  )
}
