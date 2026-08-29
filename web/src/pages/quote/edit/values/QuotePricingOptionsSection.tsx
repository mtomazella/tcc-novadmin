import { useMemo } from 'react'
import { Button } from '@mui/material'
import { FiEdit2, FiPlus } from 'react-icons/fi'
import type { QuotePricingOptionRow } from '@novadmin/lib/quote/pricingOptions'
import {
  centsToReais,
  toLocalDecimal,
} from '@novadmin/lib/utils/unitConversion'
import QuoteValuesTable, {
  type QuoteValuesTableColumn,
} from 'components/QuoteValuesTable'

type DisplayRow = {
  id: string
  name: string
  valueReto: number | ''
  valueCambotado: number | ''
  valueGarfo: number | ''
  baseValueReto?: number
  baseValueCambotado?: number
  baseValueGarfo?: number
  isQuoteSpecific: boolean
}

interface QuotePricingOptionsSectionProps {
  rows: QuotePricingOptionRow[]
  selectedId: string | null
  totalM2Reto: number
  totalM2Cambotado: number
  totalGarfoQuantity: number
  isEditing: boolean
  isLockBlocked: boolean
  isSaving: boolean
  onStartEdit: () => void
  onSave: () => void
  onCancel: () => void
  onRowChange: (id: string, field: string, value: unknown) => void
  onRowDelete: (id: string) => void
  onRowAdd: () => void
  onSelectOption: (id: string) => void
}

const displayValue = (
  centValue: number,
  baseCentValue: number | undefined,
  isQuoteSpecific: boolean,
): number | '' => {
  if (
    !isQuoteSpecific &&
    baseCentValue !== undefined &&
    centValue === baseCentValue
  ) {
    return ''
  }
  return centsToReais(centValue)
}

const fmtValue = (v: number | '', baseV: number | undefined) => {
  if (v === '') {
    return baseV !== undefined ? `R$ ${toLocalDecimal(baseV, 2)}` : ''
  }
  return `R$ ${toLocalDecimal(v, 2)}`
}

export default function QuotePricingOptionsSection({
  rows,
  selectedId,
  totalM2Reto,
  totalM2Cambotado,
  totalGarfoQuantity,
  isEditing,
  isLockBlocked,
  isSaving,
  onStartEdit,
  onSave,
  onCancel,
  onRowChange,
  onRowDelete,
  onRowAdd,
  onSelectOption,
}: QuotePricingOptionsSectionProps) {
  const displayRows = useMemo<DisplayRow[]>(
    () =>
      rows.map(row => {
        const baseReto =
          row.baseValueReto !== undefined
            ? centsToReais(row.baseValueReto)
            : undefined
        const baseCambotado =
          row.baseValueCambotado !== undefined
            ? centsToReais(row.baseValueCambotado)
            : undefined
        const baseGarfo =
          row.baseValueGarfo !== undefined
            ? centsToReais(row.baseValueGarfo)
            : undefined
        return {
          id: row.id,
          name: row.name,
          valueReto: displayValue(
            row.valueReto,
            row.baseValueReto,
            row.isQuoteSpecific,
          ),
          valueCambotado: displayValue(
            row.valueCambotado,
            row.baseValueCambotado,
            row.isQuoteSpecific,
          ),
          valueGarfo: displayValue(
            row.valueGarfo,
            row.baseValueGarfo,
            row.isQuoteSpecific,
          ),
          baseValueReto: baseReto,
          baseValueCambotado: baseCambotado,
          baseValueGarfo: baseGarfo,
          isQuoteSpecific: row.isQuoteSpecific,
        }
      }),
    [rows],
  )

  const columns = useMemo<QuoteValuesTableColumn<DisplayRow>[]>(
    () => [
      {
        key: 'selected',
        label: '',
        field: 'id',
        width: 40,
        formatter: (id: number | string) => (
          <input
            type="radio"
            name="pricingOptionSelection"
            checked={selectedId === String(id)}
            onChange={() => onSelectOption(String(id))}
            disabled={!isEditing}
            className="h-4 w-4 cursor-pointer accent-violet-500 disabled:cursor-default"
          />
        ),
      },
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
        align: 'right',
        placeholder: (row: DisplayRow) =>
          row.baseValueReto !== undefined
            ? toLocalDecimal(row.baseValueReto, 2)
            : undefined,
        formatter: (v: number | '', row: DisplayRow) =>
          fmtValue(v, row.baseValueReto),
      },
      {
        key: 'valueCambotado',
        label: 'Cambotado',
        field: 'valueCambotado',
        editable: true,
        inputType: 'number',
        precision: 2,
        prefix: 'R$',
        align: 'right',
        placeholder: (row: DisplayRow) =>
          row.baseValueCambotado !== undefined
            ? toLocalDecimal(row.baseValueCambotado, 2)
            : undefined,
        formatter: (v: number | '', row: DisplayRow) =>
          fmtValue(v, row.baseValueCambotado),
      },
      {
        key: 'valueGarfo',
        label: 'Garfos',
        field: 'valueGarfo',
        editable: true,
        inputType: 'number',
        precision: 2,
        prefix: 'R$',
        align: 'right',
        placeholder: (row: DisplayRow) =>
          row.baseValueGarfo !== undefined
            ? toLocalDecimal(row.baseValueGarfo, 2)
            : undefined,
        formatter: (v: number | '', row: DisplayRow) =>
          fmtValue(v, row.baseValueGarfo),
      },
      {
        key: 'totalProposal',
        label: 'Total Proposta',
        field: 'id',
        align: 'right',
        formatter: (_: number | string, row: DisplayRow) => {
          const reto =
            row.valueReto !== '' ? row.valueReto : row.baseValueReto ?? 0
          const cambotado =
            row.valueCambotado !== ''
              ? row.valueCambotado
              : row.baseValueCambotado ?? 0
          const garfo =
            row.valueGarfo !== '' ? row.valueGarfo : row.baseValueGarfo ?? 0
          const total =
            reto * totalM2Reto +
            cambotado * totalM2Cambotado +
            garfo * totalGarfoQuantity
          return `R$ ${toLocalDecimal(total, 2)}`
        },
      },
    ],
    [
      selectedId,
      isEditing,
      onSelectOption,
      totalM2Reto,
      totalM2Cambotado,
      totalGarfoQuantity,
    ],
  )

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
          Opções de Precificação
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

      <QuoteValuesTable<DisplayRow>
        columns={columns}
        rows={displayRows}
        mode={isEditing ? 'edit' : 'read'}
        rowIdField="id"
        emptyText="Nenhuma opção de precificação cadastrada."
        onRowChange={
          isEditing
            ? (rowId, field, value) => onRowChange(String(rowId), field, value)
            : undefined
        }
        onRowDelete={
          isEditing ? rowId => onRowDelete(String(rowId)) : undefined
        }
      />

      {isEditing && (
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="contained"
            onClick={onRowAdd}
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
        </div>
      )}
    </section>
  )
}
