import { Button } from '@mui/material'
import { FiEdit2 } from 'react-icons/fi'
import QuoteValuesTable from 'components/QuoteValuesTable'
import {
  fixedCostColumns,
  type EditableFixedCostRow,
} from 'pages/quote/edit/scopeEditHelpers'

interface QuoteFixedCostsSectionProps {
  rows: EditableFixedCostRow[]
  isEditing: boolean
  isLockBlocked: boolean
  isSaving: boolean
  onStartEdit: () => void
  onRowChange: (rowId: string | number, field: string, value: unknown) => void
  onSave: () => void
  onCancel: () => void
}

export default function QuoteFixedCostsSection({
  rows,
  isEditing,
  isLockBlocked,
  isSaving,
  onStartEdit,
  onRowChange,
  onSave,
  onCancel,
}: QuoteFixedCostsSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
          Configurações — Custos Fixos
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

      <QuoteValuesTable<EditableFixedCostRow>
        columns={fixedCostColumns}
        rows={rows}
        mode={isEditing ? 'edit' : 'read'}
        rowIdField="id"
        onRowChange={isEditing ? onRowChange : undefined}
        emptyText="Nenhum custo fixo disponível."
      />

      {isEditing && (
        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-violet-600 text-white font-medium hover:from-violet-600 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      )}
    </section>
  )
}
