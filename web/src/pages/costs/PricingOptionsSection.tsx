import React, { useMemo } from 'react'
import QuoteValuesTable, {
  type QuoteValuesTableColumn,
} from 'components/QuoteValuesTable'
import { Button } from '@mui/material'
import { FiEdit2, FiPlus } from 'react-icons/fi'
import {
  centsToReais,
  reaisToCents,
  toLocalDecimal,
} from '@novadmin/lib/utils/unitConversion'
import type { PricingOption } from 'types/cost'

export type PricingOptionDraftRow = {
  _index: number
  id: string | undefined
  name: string
  valueReto: number
  valueCambotado: number
  valueGarfo: number
}

export const blankPricingRow = (index: number): PricingOptionDraftRow => ({
  _index: index,
  id: undefined,
  name: '',
  valueReto: 0,
  valueCambotado: 0,
  valueGarfo: 0,
})

export const toDisplayPricing = (
  po: PricingOption,
  index: number,
): PricingOptionDraftRow => ({
  _index: index,
  id: po.id,
  name: po.name,
  valueReto: centsToReais(po.valueReto),
  valueCambotado: centsToReais(po.valueCambotado),
  valueGarfo: centsToReais(po.valueGarfo),
})

export const fromDisplayPricing = (row: PricingOptionDraftRow) => ({
  id: row.id,
  name: row.name,
  valueReto: reaisToCents(row.valueReto),
  valueCambotado: reaisToCents(row.valueCambotado),
  valueGarfo: reaisToCents(row.valueGarfo),
})

type Props = {
  rows: PricingOptionDraftRow[]
  isEditing: boolean
  isSaving: boolean
  canEdit: boolean
  invalidRowIndices: Set<number>
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onRowChange: (rowId: string | number, field: string, value: unknown) => void
  onRowDelete: (rowId: string | number) => void
  onAddRow: () => void
}

const PricingOptionsSection = React.memo(function PricingOptionsSection({
  rows,
  isEditing,
  isSaving,
  canEdit,
  invalidRowIndices,
  onEdit,
  onSave,
  onCancel,
  onRowChange,
  onRowDelete,
  onAddRow,
}: Props) {
  const columns: QuoteValuesTableColumn<PricingOptionDraftRow>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Alternativa',
        field: 'name',
        editable: true,
        inputType: 'text',
      },
      {
        key: 'valueReto',
        label: 'Reto',
        field: 'valueReto',
        editable: true,
        inputType: 'number',
        precision: 2,
        prefix: 'R$',
        formatter: (v: number) => `R$ ${toLocalDecimal(v, 2)}`,
        width: 140,
        align: 'right',
      },
      {
        key: 'valueCambotado',
        label: 'Cambotado',
        field: 'valueCambotado',
        editable: true,
        inputType: 'number',
        precision: 2,
        prefix: 'R$',
        formatter: (v: number) => `R$ ${toLocalDecimal(v, 2)}`,
        width: 140,
        align: 'right',
      },
      {
        key: 'valueGarfo',
        label: 'Garfos',
        field: 'valueGarfo',
        editable: true,
        inputType: 'number',
        precision: 2,
        prefix: 'R$',
        formatter: (v: number) => `R$ ${toLocalDecimal(v, 2)}`,
        width: 140,
        align: 'right',
      },
    ],
    [],
  )

  return (
    <div className="rounded-lg p-6 bg-white shadow mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Opções de Precificação
        </h2>
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
        rowIdField="_index"
        emptyText="Nenhuma opção de precificação encontrada."
        onRowChange={onRowChange}
        onRowDelete={isEditing ? onRowDelete : undefined}
        getRowClassName={row =>
          invalidRowIndices.has(row._index)
            ? 'bg-red-50 outline outline-1 outline-red-300'
            : ''
        }
      />

      {invalidRowIndices.size > 0 && (
        <p className="mt-2 text-sm text-red-600">
          Preencha o nome de todas as opções destacadas em vermelho antes de
          salvar.
        </p>
      )}

      {isEditing && (
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="contained"
            onClick={onAddRow}
            disabled={isSaving}
            startIcon={<FiPlus style={{ color: 'white' }} />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 2,
              backgroundColor: 'rgb(124, 58, 237)',
              '&:hover': { backgroundColor: 'rgb(109, 40, 217)' },
            }}
          >
            Adicionar Opção
          </Button>

          <div className="flex gap-3">
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
        </div>
      )}
    </div>
  )
})

export default PricingOptionsSection
