import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GenericModal from 'components/GenericModal'
import type { EditingMaterial } from 'types/supplier'
import { materialTypes, materialTypeLabels } from '../../utils/materialTypes'
import QuoteValuesTable, {
  type QuoteValuesTableColumn,
} from 'components/QuoteValuesTable'
import { Button } from '@mui/material'
import { FiPlus } from 'react-icons/fi'

type SupplierMaterialRow = {
  _index: number
  sku: string
  name: string
  description: string
  type: string
  value: number | ''
}

const BLANK_ROW: EditingMaterial = {
  sku: '',
  name: '',
  description: '',
  type: '',
  value: '',
}

const isBlankRow = (m: EditingMaterial) =>
  !m.sku.trim() &&
  !m.name.trim() &&
  !m.description.trim() &&
  !m.type &&
  (m.value === '' || m.value == null)

const isRowValid = (m: EditingMaterial) =>
  !!m.sku.trim() &&
  !!m.name.trim() &&
  !!m.description.trim() &&
  !!m.type &&
  m.value !== '' &&
  m.value != null

// ─── Memoized materials section ───────────────────────────────────────────────
// Only re-renders on structural changes (add/delete rows) or validation state.
// Cell value changes go straight to a ref in EditSupplier — this component
// never sees them.

type MaterialsSectionProps = {
  materials: EditingMaterial[]
  isLoading: boolean
  invalidRowIndices: Set<number>
  onRowChange: (
    rowIndex: string | number,
    field: string,
    value: unknown,
  ) => void
  onRowDelete: (rowIndex: string | number) => void
  onAddRow: () => void
}

const MaterialsSection = React.memo(function MaterialsSection({
  materials,
  isLoading,
  invalidRowIndices,
  onRowChange,
  onRowDelete,
  onAddRow,
}: MaterialsSectionProps) {
  const rows: SupplierMaterialRow[] = useMemo(
    () =>
      materials.map((m, i) => ({
        _index: i,
        sku: m.sku,
        name: m.name,
        description: m.description || '',
        type: m.type,
        value: m.value === '' || m.value == null ? '' : (m.value as number),
      })),
    [materials],
  )

  const columns: QuoteValuesTableColumn<SupplierMaterialRow>[] = useMemo(
    () => [
      {
        key: 'sku',
        label: 'SKU',
        field: 'sku',
        editable: true,
        inputType: 'text',
        width: 200,
      },
      {
        key: 'name',
        label: 'Nome',
        field: 'name',
        editable: true,
        inputType: 'text',
        width: '22%',
      },
      {
        key: 'description',
        label: 'Descrição',
        field: 'description',
        editable: true,
        inputType: 'text',
      },
      {
        key: 'type',
        label: 'Tipo de Material',
        field: 'type',
        formatter: (value: string, row: SupplierMaterialRow) => (
          <select
            value={value}
            onChange={e => onRowChange(row._index, 'type', e.target.value)}
            disabled={isLoading}
            className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          >
            <option value="">Selecione o tipo</option>
            {materialTypes.map(t => (
              <option key={t} value={t}>
                {materialTypeLabels[t]}
              </option>
            ))}
          </select>
        ),
        width: 180,
      },
      {
        key: 'value',
        label: 'R$',
        field: 'value',
        editable: true,
        inputType: 'number',
        precision: 2,
        prefix: 'R$',
        width: 120,
      },
    ],
    [isLoading, onRowChange],
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Materiais</h3>
        <Button
          variant="contained"
          onClick={onAddRow}
          disabled={isLoading}
          startIcon={<FiPlus style={{ color: 'white' }} />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: 2,
            backgroundColor: 'rgb(124, 58, 237)',
            '&:hover': { backgroundColor: 'rgb(109, 40, 217)' },
          }}
        >
          Adicionar Material
        </Button>
      </div>
      <QuoteValuesTable
        columns={columns}
        rows={rows}
        mode={isLoading ? 'read' : 'edit'}
        rowIdField="_index"
        emptyText="Nenhum material adicionado."
        onRowChange={onRowChange}
        onRowDelete={onRowDelete}
        getRowClassName={row =>
          invalidRowIndices.has(row._index)
            ? 'bg-red-50 outline outline-1 outline-red-300'
            : ''
        }
      />
      {invalidRowIndices.size > 0 && (
        <p className="mt-2 text-sm text-red-600">
          Preencha todos os campos das linhas destacadas em vermelho.
        </p>
      )}
    </div>
  )
})

// ─── Main component ────────────────────────────────────────────────────────────

interface EditSupplierProps {
  isModalOpen: boolean
  onClose: () => void
  initialName: string
  initialMaterials: EditingMaterial[]
  onSave: (
    name: string,
    materials: EditingMaterial[],
    deletedIds: number[],
  ) => void
  isLoading: boolean
  isEditing: boolean
}

const EditSupplier: React.FC<EditSupplierProps> = ({
  isModalOpen,
  onClose,
  initialName,
  initialMaterials,
  onSave,
  isLoading,
  isEditing,
}) => {
  const [localName, setLocalName] = useState('')
  // structuralMaterials drives the table render — updated only on add/delete/type/validation.
  // draftRef is the authoritative source for all cell edits (no re-renders).
  const [structuralMaterials, setStructuralMaterials] = useState<
    EditingMaterial[]
  >([BLANK_ROW])
  const draftRef = useRef<EditingMaterial[]>([BLANK_ROW])
  // Tracks SKU count for the save button without re-rendering the table.
  const [validSkuCount, setValidSkuCount] = useState(0)
  const [localDeletedIds, setLocalDeletedIds] = useState<number[]>([])
  const [invalidRowIndices, setInvalidRowIndices] = useState<Set<number>>(
    new Set(),
  )

  const initialNameRef = useRef(initialName)
  initialNameRef.current = initialName
  const initialMaterialsRef = useRef(initialMaterials)
  initialMaterialsRef.current = initialMaterials

  useEffect(() => {
    if (isModalOpen) {
      const mats =
        initialMaterialsRef.current.length > 0
          ? initialMaterialsRef.current
          : [BLANK_ROW]
      setLocalName(initialNameRef.current)
      draftRef.current = mats
      setStructuralMaterials(mats)
      setValidSkuCount(mats.filter(m => m.sku.trim()).length)
      setLocalDeletedIds([])
      setInvalidRowIndices(new Set())
    }
  }, [isModalOpen])

  // Cell change: write to ref only — zero re-renders for text/number fields.
  // Exceptions:
  //   'sku'  — also update validSkuCount so the save button reacts
  //   'type' — the <select> is a controlled component with no local state,
  //            so the structural state must update for the selection to appear
  const handleRowChange = useCallback(
    (rowIndex: string | number, field: string, value: unknown) => {
      const index = Number(rowIndex)
      const next = [...draftRef.current]
      next[index] = { ...next[index], [field]: value }
      draftRef.current = next

      if (field === 'sku') {
        setValidSkuCount(next.filter(m => (m.sku as string).trim()).length)
      }
      if (field === 'type') {
        setStructuralMaterials(prev => {
          const updated = [...prev]
          updated[index] = { ...updated[index], type: value as string }
          return updated
        })
      }
    },
    [],
  )

  // Structural change: flush ref into state so MaterialsSection sees current values.
  const handleRowDelete = useCallback((rowIndex: string | number) => {
    const index = Number(rowIndex)
    setStructuralMaterials(prev => {
      if (prev.length <= 1) return prev
      const current = prev.map((row, i) => draftRef.current[i] ?? row)
      const row = current[index]
      if (row.id) {
        setLocalDeletedIds(ids => [...ids, row.id!])
      }
      const next = [...current]
      next.splice(index, 1)
      draftRef.current = next
      setValidSkuCount(next.filter(m => (m.sku as string).trim()).length)
      setInvalidRowIndices(new Set())
      return next
    })
  }, [])

  const handleAddRow = useCallback(() => {
    setStructuralMaterials(prev => {
      const next = [
        ...prev.map((row, i) => draftRef.current[i] ?? row),
        BLANK_ROW,
      ]
      draftRef.current = next
      setInvalidRowIndices(new Set())
      return next
    })
  }, [])

  const handleSave = () => {
    const current = draftRef.current

    const invalid = new Set(
      current
        .map((m, i) => ({ m, i }))
        .filter(({ m }) => !isBlankRow(m) && !isRowValid(m))
        .map(({ i }) => i),
    )

    if (invalid.size > 0) {
      // Flush ref to state so the highlighted rows show their current values
      setStructuralMaterials([...current])
      setInvalidRowIndices(invalid)
      return
    }

    setInvalidRowIndices(new Set())
    onSave(
      localName,
      current.filter(m => !isBlankRow(m)),
      localDeletedIds,
    )
  }

  const isSaveDisabled = !localName.trim() || validSkuCount === 0

  if (!isModalOpen) return null

  return (
    <>
      <GenericModal
        isOpen={isModalOpen}
        onClose={onClose}
        title={isEditing ? 'Editar Fornecedor' : 'Cadastro de Fornecedor'}
        onSave={handleSave}
        saveButtonText="Salvar"
        size="2xl"
        closeOnBackdropClick={false}
        isLoading={isLoading}
        disableSave={isSaveDisabled}
      >
        <div className="space-y-6">
          <div>
            <label className="block font-medium mb-1 text-2xl lg:text-base">
              Nome
            </label>
            <input
              type="text"
              className="w-full p-2 text-sm md:text-base border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              value={localName.toUpperCase()}
              onChange={e =>
                setLocalName(e.target.value.substring(0, 115).toUpperCase())
              }
              placeholder="Nome do fornecedor"
              required
            />
          </div>

          <MaterialsSection
            materials={structuralMaterials}
            isLoading={isLoading}
            invalidRowIndices={invalidRowIndices}
            onRowChange={handleRowChange}
            onRowDelete={handleRowDelete}
            onAddRow={handleAddRow}
          />
        </div>
      </GenericModal>
    </>
  )
}

export default EditSupplier
