import React, { useMemo } from 'react'
import QuoteValuesTable, {
  type QuoteValuesTableColumn,
} from 'components/QuoteValuesTable'
import { Button } from '@mui/material'
import { FiEdit2 } from 'react-icons/fi'
import {
  centsToReais,
  reaisToCents,
  decimalToPercent,
  percentToDecimal,
  toLocalDecimal,
} from '@novadmin/lib/utils/unitConversion'
import type { FixedCost } from 'types/cost'

export type FixedCostDraftRow = {
  _id: string
  name: string
  description: string
  valueType: 'price' | 'percentage'
  value: number
}

export const toDisplayFixed = (fc: FixedCost): FixedCostDraftRow => ({
  _id: fc.id,
  name: fc.name,
  description: fc.description || '',
  valueType: fc.valueType,
  value:
    fc.valueType === 'price'
      ? centsToReais(fc.value)
      : decimalToPercent(fc.value),
})

export const fromDisplayFixed = (row: FixedCostDraftRow) => ({
  id: row._id,
  name: row.name,
  description: row.description,
  valueType: row.valueType,
  value:
    row.valueType === 'price'
      ? reaisToCents(row.value)
      : percentToDecimal(row.value),
})

type Props = {
  rows: FixedCostDraftRow[]
  isEditing: boolean
  isSaving: boolean
  canEdit: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onRowChange: (rowId: string | number, field: string, value: unknown) => void
}

const FixedCostsSection = React.memo(function FixedCostsSection({
  rows,
  isEditing,
  isSaving,
  canEdit,
  onEdit,
  onSave,
  onCancel,
  onRowChange,
}: Props) {
  const columns: QuoteValuesTableColumn<FixedCostDraftRow>[] = useMemo(
    () => [
      { key: 'name', label: 'Elemento', field: 'name' },
      { key: 'description', label: 'Especificações', field: 'description' },
      {
        key: 'value',
        label: 'Valor',
        field: 'value',
        editable: true,
        inputType: 'number',
        precision: 2,
        prefix: (row: FixedCostDraftRow) =>
          row.valueType === 'price' ? 'R$' : undefined,
        suffix: (row: FixedCostDraftRow) =>
          row.valueType === 'percentage' ? '%' : undefined,
        formatter: (value: number, row: FixedCostDraftRow) =>
          row.valueType === 'price'
            ? `R$ ${toLocalDecimal(value, 2)}`
            : `${toLocalDecimal(value, 2)}%`,
        width: 160,
        align: 'right',
      },
    ],
    [],
  )

  return (
    <div className="rounded-lg p-6 bg-white shadow mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Custos Fixos</h2>
        {canEdit && !isEditing && (
          <Button
            variant="contained"
            onClick={onEdit}
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

      <QuoteValuesTable
        columns={columns}
        rows={rows}
        mode={isEditing ? 'edit' : 'read'}
        rowIdField="_id"
        emptyText="Nenhum custo fixo encontrado."
        onRowChange={onRowChange}
      />

      {isEditing && (
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-violet-600 text-white font-medium hover:from-violet-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      )}
    </div>
  )
})

export default FixedCostsSection
