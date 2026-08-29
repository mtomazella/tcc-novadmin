import { Button } from '@mui/material'
import { FiEdit2 } from 'react-icons/fi'
import QuoteValuesTable from 'components/QuoteValuesTable'
import {
  productConsumptionColumns,
  type EditableProductConsumptionRow,
} from 'pages/quote/edit/scopeEditHelpers'

interface QuoteElementsSectionProps {
  rows: EditableProductConsumptionRow[]
  isEditing: boolean
  isLockBlocked: boolean
  isSaving: boolean
  onStartEdit: () => void
  onRowChange: (rowId: string | number, field: string, value: unknown) => void
  onSave: () => void
  onCancel: () => void
}

export default function QuoteElementsSection({
  rows,
  isEditing,
  isLockBlocked,
  isSaving,
  onStartEdit,
  onRowChange,
  onSave,
  onCancel,
}: QuoteElementsSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
          Configurações — Elementos
        </h3>
        {!isEditing && (
          <Button
            variant="contained"
            onClick={onStartEdit}
            disabled={isLockBlocked}
            startIcon={<FiEdit2 style={{ color: 'white' }} />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 2,
              backgroundColor: 'rgb(124, 58, 237)',
              '&:hover': { backgroundColor: 'rgb(109, 40, 217)' },
            }}
          >
            Editar
          </Button>
        )}
      </div>

      <QuoteValuesTable<EditableProductConsumptionRow>
        columns={productConsumptionColumns}
        rows={rows}
        mode={isEditing ? 'edit' : 'read'}
        rowIdField="category"
        getRowType={row => (row as any)._rowType ?? 'body'}
        onRowChange={isEditing ? onRowChange : undefined}
        emptyText="Nenhum elemento disponível."
      />

      {isEditing && (
        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-violet-600 text-white font-medium hover:from-violet-600 hover:to-violet-700"
          >
            Salvar
          </button>
        </div>
      )}
    </section>
  )
}
