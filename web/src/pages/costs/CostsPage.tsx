import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Header from 'components/Header'
import GenericModal from 'components/GenericModal'
import { useCostsPage } from 'hooks/costs/useCostsPage'
import FixedCostsSection, {
  type FixedCostDraftRow,
  toDisplayFixed,
  fromDisplayFixed,
} from './FixedCostsSection'
import PricingOptionsSection, {
  type PricingOptionDraftRow,
  toDisplayPricing,
  fromDisplayPricing,
  blankPricingRow,
} from './PricingOptionsSection'

const CostsPage: React.FC = () => {
  const {
    fixedCosts,
    pricingOptions,
    isLoading,
    apiError,
    loadData,
    saveFixedCosts,
    savePricingOptions,
    canEdit,
    canView,
  } = useCostsPage()

  const fixedCostRows = useMemo(() => fixedCosts.map(toDisplayFixed), [fixedCosts])
  const pricingOptionRows = useMemo(
    () => pricingOptions.map((po, i) => toDisplayPricing(po, i)),
    [pricingOptions],
  )

  const [isEditingFixed, setIsEditingFixed] = useState(false)
  const [isSavingFixed, setIsSavingFixed] = useState(false)
  const [fixedDraft, setFixedDraft] = useState<FixedCostDraftRow[]>([])
  const fixedDraftRef = useRef<FixedCostDraftRow[]>([])

  const [isEditingPricing, setIsEditingPricing] = useState(false)
  const [isSavingPricing, setIsSavingPricing] = useState(false)
  const [pricingDraft, setPricingDraft] = useState<PricingOptionDraftRow[]>([])
  const pricingDraftRef = useRef<PricingOptionDraftRow[]>([])
  const [invalidPricingIndices, setInvalidPricingIndices] = useState<Set<number>>(new Set())
  const [deletedPricingIds, setDeletedPricingIds] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Fixed costs handlers ─────────────────────────────────────────────────────

  const handleEditFixed = useCallback(() => {
    const draft = fixedCosts.map(toDisplayFixed)
    fixedDraftRef.current = draft
    setFixedDraft(draft)
    setIsEditingFixed(true)
  }, [fixedCosts])

  const handleCancelFixed = useCallback(() => {
    setIsEditingFixed(false)
    setFixedDraft([])
    fixedDraftRef.current = []
  }, [])

  const handleRowChangeFixed = useCallback(
    (rowId: string | number, field: string, value: unknown) => {
      const idx = fixedDraftRef.current.findIndex(r => r._id === String(rowId))
      if (idx === -1) return
      const next = [...fixedDraftRef.current]
      next[idx] = { ...next[idx], [field]: value }
      fixedDraftRef.current = next
    },
    [],
  )

  const handleSaveFixed = useCallback(async () => {
    const hasInvalidValue = fixedDraftRef.current.some(row => !Number.isFinite(row.value))
    if (hasInvalidValue) {
      toast.error('Preencha todos os valores dos custos fixos.')
      return
    }
    setIsSavingFixed(true)
    const records = fixedDraftRef.current.map(fromDisplayFixed)
    const ok = await saveFixedCosts(records)
    setIsSavingFixed(false)
    if (ok) setIsEditingFixed(false)
  }, [saveFixedCosts])

  // ── Pricing options handlers ─────────────────────────────────────────────────

  const handleEditPricing = useCallback(() => {
    const draft = pricingOptions.map((po, i) => toDisplayPricing(po, i))
    pricingDraftRef.current = draft
    setPricingDraft(draft)
    setInvalidPricingIndices(new Set())
    setDeletedPricingIds([])
    setIsEditingPricing(true)
  }, [pricingOptions])

  const handleCancelPricing = useCallback(() => {
    setIsEditingPricing(false)
    setPricingDraft([])
    pricingDraftRef.current = []
    setInvalidPricingIndices(new Set())
    setDeletedPricingIds([])
  }, [])

  const handleRowChangePricing = useCallback(
    (rowId: string | number, field: string, value: unknown) => {
      const index = Number(rowId)
      const next = [...pricingDraftRef.current]
      next[index] = { ...next[index], [field]: value }
      pricingDraftRef.current = next

      if (field === 'name') {
        setInvalidPricingIndices(prev => {
          if (!prev.has(index)) return prev
          const updated = new Set(prev)
          updated.delete(index)
          return updated
        })
      }
    },
    [],
  )

  // re-indexes remaining rows to keep _index === array position
  const handleRowDeletePricing = useCallback((rowId: string | number) => {
    const deleteIndex = Number(rowId)
    setPricingDraft(prev => {
      const synced = prev.map((row, i) => pricingDraftRef.current[i] ?? row)
      const deleted = synced[deleteIndex]
      if (deleted?.id) setDeletedPricingIds(ids => [...ids, deleted.id!])
      const next = synced
        .filter((_, i) => i !== deleteIndex)
        .map((row, i) => ({ ...row, _index: i }))
      pricingDraftRef.current = next
      setInvalidPricingIndices(new Set())
      return next
    })
  }, [])

  const handleAddPricingRow = useCallback(() => {
    setPricingDraft(prev => {
      const synced = prev.map((row, i) => pricingDraftRef.current[i] ?? row)
      const next = [...synced, blankPricingRow(synced.length)]
      pricingDraftRef.current = next
      setInvalidPricingIndices(new Set())
      return next
    })
  }, [])

  const handleSavePricing = useCallback(async () => {
    const current = pricingDraftRef.current
    const invalid = new Set(
      current.map((row, i) => ({ row, i })).filter(({ row }) => !row.name.trim()).map(({ i }) => i),
    )
    if (invalid.size > 0) {
      setPricingDraft([...current])
      setInvalidPricingIndices(invalid)
      return
    }
    setInvalidPricingIndices(new Set())
    setIsSavingPricing(true)
    const records = current.map(fromDisplayPricing)
    const ok = await savePricingOptions(records, deletedPricingIds)
    setIsSavingPricing(false)
    if (ok) {
      setDeletedPricingIds([])
      setIsEditingPricing(false)
    }
  }, [savePricingOptions, deletedPricingIds])

  // ── Leave guard ──────────────────────────────────────────────────────────────

  const isDirty = isEditingFixed || isEditingPricing
  const [isLeaveGuardOpen, setIsLeaveGuardOpen] = useState(false)
  const [isResolvingLeave, setIsResolvingLeave] = useState(false)

  const blocker = useBlocker(useCallback(() => isDirty, [isDirty]))

  useEffect(() => {
    if (blocker.state === 'blocked') setIsLeaveGuardOpen(true)
  }, [blocker.state])

  const stayOnPage = useCallback(() => {
    blocker.reset?.()
    setIsLeaveGuardOpen(false)
  }, [blocker])

  const discardAndNavigate = useCallback(() => {
    setIsEditingFixed(false)
    setFixedDraft([])
    fixedDraftRef.current = []
    setIsEditingPricing(false)
    setPricingDraft([])
    pricingDraftRef.current = []
    setInvalidPricingIndices(new Set())
    setDeletedPricingIds([])
    setIsLeaveGuardOpen(false)
    blocker.proceed?.()
  }, [blocker])

  const saveAndNavigate = useCallback(async () => {
    setIsResolvingLeave(true)
    try {
      if (isEditingFixed) {
        if (fixedDraftRef.current.some(row => !Number.isFinite(row.value))) {
          toast.error('Preencha todos os valores dos custos fixos.')
          return
        }
        const ok = await saveFixedCosts(fixedDraftRef.current.map(fromDisplayFixed))
        if (!ok) return
      }

      if (isEditingPricing) {
        const current = pricingDraftRef.current
        const invalid = new Set(
          current.map((row, i) => ({ row, i })).filter(({ row }) => !row.name.trim()).map(({ i }) => i),
        )
        if (invalid.size > 0) {
          setPricingDraft([...current])
          setInvalidPricingIndices(invalid)
          return
        }
        const ok = await savePricingOptions(current.map(fromDisplayPricing), deletedPricingIds)
        if (!ok) return
      }

      setIsLeaveGuardOpen(false)
      blocker.proceed?.()
    } finally {
      setIsResolvingLeave(false)
    }
  }, [blocker, isEditingFixed, isEditingPricing, saveFixedCosts, savePricingOptions, deletedPricingIds])

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!canView) {
    return (
      <div className="ml-0 p-4 min-h-screen bg-gray-50">
        <Header Title="Custos" />
        <div className="px-2 py-4 sm:px-4">
          <div className="rounded-lg p-6 bg-white shadow text-center">
            <p className="text-red-500 text-lg">Você não tem permissão para visualizar custos.</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="ml-0 p-4 min-h-screen bg-gray-50">
        <Header Title="Custos" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C3AED]" />
        </div>
      </div>
    )
  }

  return (
    <div className="ml-0 p-4 min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      <Header Title="Custos" />

      <GenericModal
        isOpen={isLeaveGuardOpen}
        onClose={stayOnPage}
        title="Sair sem salvar?"
        showCancelButton={false}
        size="md"
      >
        <p className="text-sm text-gray-700">
          Você tem alterações não salvas. Escolha como deseja prosseguir.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={stayOnPage}
            disabled={isResolvingLeave}
            className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Ficar
          </button>
          <button
            type="button"
            onClick={discardAndNavigate}
            disabled={isResolvingLeave}
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Ignorar alterações e sair
          </button>
          <button
            type="button"
            onClick={() => void saveAndNavigate()}
            disabled={isResolvingLeave}
            className="rounded bg-violet-500 px-3 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isResolvingLeave ? 'Salvando...' : 'Salvar e sair'}
          </button>
        </div>
      </GenericModal>

      <main className="px-2 py-4 sm:px-4">
        {apiError && (
          <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p>{apiError}</p>
          </div>
        )}

        <FixedCostsSection
          rows={isEditingFixed ? fixedDraft : fixedCostRows}
          isEditing={isEditingFixed}
          isSaving={isSavingFixed}
          canEdit={canEdit}
          onEdit={handleEditFixed}
          onSave={handleSaveFixed}
          onCancel={handleCancelFixed}
          onRowChange={handleRowChangeFixed}
        />

        <PricingOptionsSection
          rows={isEditingPricing ? pricingDraft : pricingOptionRows}
          isEditing={isEditingPricing}
          isSaving={isSavingPricing}
          canEdit={canEdit}
          invalidRowIndices={invalidPricingIndices}
          onEdit={handleEditPricing}
          onSave={handleSavePricing}
          onCancel={handleCancelPricing}
          onRowChange={handleRowChangePricing}
          onRowDelete={handleRowDeletePricing}
          onAddRow={handleAddPricingRow}
        />
      </main>
    </div>
  )
}

export default CostsPage
