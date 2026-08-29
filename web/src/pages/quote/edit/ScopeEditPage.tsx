import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CircularProgress } from '@mui/material'
import { FiArrowLeft, FiSave, FiX } from 'react-icons/fi'
import { useBlocker, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import type {
  IncludeDatabaseDates,
  MaterialType,
  Product as LibProduct,
  Quote,
  QuoteElementType,
  QuoteFixedCost,
  QuoteFixedCostValueType,
  QuoteScope,
  QuoteScopeMaterialSelection,
  QuoteScopeMaterialSnapshotMap,
  QuoteScopeProductSnapshotMap,
} from '@novadmin/lib/types'
import { MaterialTypes } from '@novadmin/lib/types'
import {
  elementsToGroupedElements,
  calculateGroupPercentageTotals,
} from '@novadmin/lib/quote/groupedElements'
import { appendElementDerivedValues } from '@novadmin/lib/quote/elements'
import { computedElements as computedElementsLib } from '@novadmin/lib/quote'
import QuoteValuesTable, {
  type QuoteValuesTableColumn,
} from 'components/QuoteValuesTable'
import { getFixedCosts } from 'services/api/fixedCostService'
import { getMaterials } from 'services/api/materialService'
import { getProducts } from 'services/api/productService'
import {
  getQuoteById,
  getQuoteElements,
  getQuoteScopes,
  lockQuoteScope,
  unlockQuoteScope,
  updateQuoteProducts,
  upsertQuoteScope,
} from 'services/api/quoteService'
import type { QuoteElementApiItem, QuoteScopeApiItem } from 'types/quote'
import type { Material } from 'types/supplier'
import {
  defaultProductConsumptionRates,
  defaultProductModifiers,
} from 'types/product'
import type { Product } from 'types/product'
import GenericModal from 'components/GenericModal'
import RichTextEditor from 'components/RichTextEditor'
import { sectionLabels } from './elements/shared'
import { scopeSummaryColumns, toScopeSummaryRows } from './scopeSummaryHelpers'
import type { EditableQuoteScope, MaterialTableRow } from './scopeEditHelpers'
import {
  buildMaterialSnapshot,
  deriveProductConsumptionFromGroups,
  resolveEffectiveConsumptionPercentages,
  deriveSelectionsFromElements,
  fixedCostColumns,
  getSuppliersForSku,
  getUniqueSkusForType,
  materialTypeLabels,
  productConsumptionColumns,
  toFixedCostRows,
  toPersistableScope,
} from './scopeEditHelpers'
import {
  getMaterialSelectionKey,
  materialTypeToIcKey,
} from '@novadmin/lib/quote/materials'
import {
  getOverriddenMaterialSelectionValue,
  getOverriddenProductConsumption,
} from '@novadmin/lib/quote/overrides'
import {
  centsToReais,
  reaisToCents,
  percentToDecimal,
  toLocalDecimal,
  normalizeNumber,
  roundToTwo,
} from '@novadmin/lib/utils/unitConversion'
import ElementsEditor from './elements/ElementsEditor'

const SPINNER_SX = { color: '#7C3AED' }

const ScopeEditPage: React.FC = () => {
  const navigate = useNavigate()
  const { id, scopeId } = useParams()
  const quoteId = Number(id)
  const numericScopeId = Number(scopeId)

  // Scope state
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLeaveGuardModalOpen, setIsLeaveGuardModalOpen] = useState(false)
  const [isResolvingLeave, setIsResolvingLeave] = useState(false)
  const [scopeLockAcquired, setScopeLockAcquired] = useState(false)
  const [loadedScope, setLoadedScope] = useState<QuoteScopeApiItem | null>(null)
  const [editingScopeDraft, setEditingScopeDraft] =
    useState<EditableQuoteScope | null>(null)
  const [materialCatalog, setMaterialCatalog] = useState<Material[]>([])
  const [baseCosts, setBaseCosts] = useState<QuoteFixedCost[]>([])
  const [quoteRecord, setQuoteRecord] = useState<Quote | null>(null)
  const isReadOnly = quoteRecord?.isLeaf === false
  const scopeLockAcquiredRef = useRef(false)
  const allowBlockedNavigationRef = useRef(false)

  // Raw scope elements (for summary and material table quantities)
  const [scopeRawElements, setScopeRawElements] = useState<
    QuoteElementApiItem[]
  >([])

  const [products, setProducts] = useState<Product[]>([])

  // ─── Scope lock handlers ─────────────────────────────────────────────────

  const releaseScopeLock = useCallback(async () => {
    if (!scopeLockAcquiredRef.current || !Number.isFinite(numericScopeId))
      return true
    try {
      await unlockQuoteScope({ id: numericScopeId })
      scopeLockAcquiredRef.current = false
      setScopeLockAcquired(false)
      return true
    } catch (error) {
      toast.error(
        (error as Error)?.message || 'Não foi possível desbloquear o escopo',
      )
      return false
    }
  }, [numericScopeId])

  const backToQuote = useCallback(() => {
    navigate(`/orcamento/edit/${quoteId}`)
  }, [navigate, quoteId])

  // ─── Init ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!Number.isFinite(quoteId) || !Number.isFinite(numericScopeId)) {
      toast.error('Parâmetros inválidos para edição de escopo')
      navigate('/orcamento')
      return
    }

    void (async () => {
      setIsLoading(true)
      try {
        const scopeResponse = await getQuoteScopes({
          quoteId,
          id: numericScopeId,
          activationStatus: 'active',
        })
        const freshScope = scopeResponse.data?.[0]

        if (!freshScope) {
          toast.error('Escopo não encontrado')
          backToQuote()
          return
        }

        const quoteCheckResponse = await getQuoteById(quoteId)
        const isQuoteReadOnly = quoteCheckResponse.data?.[0]?.isLeaf === false

        if (freshScope.isLocked && !isQuoteReadOnly) {
          toast.error(
            freshScope.isLockedByAnotherUser
              ? 'Este escopo já está sendo editado por outro usuário.'
              : 'Este escopo já está sendo editado por você em outra tela.',
          )
          backToQuote()
          return
        }

        if (!isQuoteReadOnly) {
          await lockQuoteScope({ id: numericScopeId })
          scopeLockAcquiredRef.current = true
          setScopeLockAcquired(true)
        }

        const [
          elementsResponse,
          quoteResponse,
          materialsResponse,
          productsResponse,
          fixedCostsResponse,
        ] = await Promise.all([
          getQuoteElements({
            quoteId,
            scopeId: numericScopeId,
            activationStatus: 'active',
            includeProduct: true,
          }),
          getQuoteById(quoteId),
          getMaterials({ page: 1, limit: 1000, includeSupplier: true }),
          getProducts({ page: 1, limit: 1000, order: 'name' }),
          getFixedCosts({ limit: 1000, sort_by: 'name', sort_order: 'asc' }),
        ])

        const rawScopeElements = elementsResponse.data || []
        const loadedQuote = quoteResponse.data?.[0]
        const catalog = materialsResponse.data || []
        const fetchedProducts = productsResponse.data || []
        setProducts(fetchedProducts)
        setBaseCosts(
          (fixedCostsResponse.data || []) as unknown as QuoteFixedCost[],
        )
        setQuoteRecord((loadedQuote ?? null) as unknown as Quote | null)

        const freshProductMap = new Map(
          fetchedProducts.map(p => [
            Number(p.id),
            p as unknown as IncludeDatabaseDates<LibProduct>,
          ]),
        )
        const derivedRawElements = rawScopeElements.map(
          appendElementDerivedValues,
        )
        const allInitialElements = [
          ...derivedRawElements,
          ...computedElementsLib.generateComputedElements(
            derivedRawElements,
            [freshScope as unknown as QuoteScope],
            freshProductMap,
          ),
        ]

        const draft: EditableQuoteScope = {
          ...freshScope,
          overriddenFixedCosts: freshScope.overriddenFixedCosts || [],
          overriddenProductConsumption:
            freshScope.overriddenProductConsumption || [],
          materialSelections: deriveSelectionsFromElements(
            allInitialElements,
            (freshScope.materialSelections as unknown as QuoteScopeMaterialSelection[]) ||
              [],
          ),
        }

        setLoadedScope(freshScope)
        setEditingScopeDraft(draft)
        setScopeRawElements(rawScopeElements)
        setMaterialCatalog(catalog)
      } catch (error) {
        toast.error(
          (error as Error)?.message ||
            'Não foi possível iniciar a edição do escopo',
        )
        backToQuote()
      } finally {
        setIsLoading(false)
      }
    })()

    return () => {
      void releaseScopeLock()
    }
  }, [backToQuote, navigate, numericScopeId, quoteId, releaseScopeLock])

  // Warn on browser close/refresh while holding scope lock
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!scopeLockAcquiredRef.current) return
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Release lock when the page is actually destroyed (close, refresh, external navigation).
  // pagehide fires after the user confirms the beforeunload dialog; persisted=true means
  // the page is going into BF cache, not being destroyed, so we skip it in that case.
  useEffect(() => {
    const handlePageHide = (e: PageTransitionEvent) => {
      if (!scopeLockAcquiredRef.current || e.persisted) return
      const token = localStorage.getItem('authToken')
      const baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ?? ''
      fetch(`${baseUrl}/quote/scope/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: numericScopeId }),
        keepalive: true,
      }).catch(() => {})
    }
    window.addEventListener('pagehide', handlePageHide)
    return () => window.removeEventListener('pagehide', handlePageHide)
  }, [numericScopeId])

  // ─── Scope draft handlers ────────────────────────────────────────────────

  const updateDraftField = <K extends keyof EditableQuoteScope>(
    field: K,
    value: EditableQuoteScope[K],
  ) => {
    setEditingScopeDraft(prev => (prev ? { ...prev, [field]: value } : prev))
  }

  const updateFixedCostRow = (
    rowId: string | number,
    field: string,
    value: unknown,
  ) => {
    if (field !== 'value') return
    const baseCost = baseCosts.find(c => c.id === rowId)
    if (!baseCost) return
    setEditingScopeDraft(prev => {
      if (!prev) return prev
      const overrides = prev.overriddenFixedCosts || []
      if (value === '') {
        return {
          ...prev,
          overriddenFixedCosts: overrides.filter(c => c.id !== rowId),
        }
      }
      const display = normalizeNumber(value)
      const stored =
        baseCost.valueType === 'price'
          ? reaisToCents(display)
          : percentToDecimal(display)
      const updated: QuoteFixedCost = {
        id: baseCost.id,
        name: baseCost.name,
        description: baseCost.description,
        valueType: baseCost.valueType as QuoteFixedCostValueType,
        value: stored,
      }
      const idx = overrides.findIndex(c => c.id === rowId)
      return {
        ...prev,
        overriddenFixedCosts:
          idx >= 0
            ? overrides.map((c, i) => (i === idx ? updated : c))
            : [...overrides, updated],
      }
    })
  }

  const updateProductConsumptionRow = (
    rowId: string | number,
    field: string,
    value: unknown,
  ) => {
    const rateFields = [
      'icChapa1',
      'icRipa1',
      'icChapa2',
      'icRipa2',
      'icChapa3',
      'icRipa3',
    ]
    const category = String(rowId)
    setEditingScopeDraft(prev => {
      if (!prev) return prev
      const existing = prev.overriddenProductConsumption || []
      const idx = existing.findIndex(item => item.category === category)
      const current =
        idx >= 0
          ? existing[idx]
          : {
              id: 0,
              category,
              commercialPercentage: null,
              projectPercentage: null,
              consumptionRates: {
                icChapa1: null,
                icRipa1: null,
                icChapa2: null,
                icRipa2: null,
                icChapa3: null,
                icRipa3: null,
              },
            }
      let updated = current
      if (field === 'commercialPercentage' || field === 'projectPercentage') {
        updated = {
          ...current,
          [field]:
            value === '' ? null : percentToDecimal(normalizeNumber(value)),
        }
      } else if (rateFields.includes(field)) {
        updated = {
          ...current,
          consumptionRates: {
            ...current.consumptionRates,
            [field]: value === '' ? null : normalizeNumber(value),
          },
        }
      }
      const nextOverrides =
        idx >= 0
          ? existing.map((item, i) => (i === idx ? updated : item))
          : [...existing, updated]
      return { ...prev, overriddenProductConsumption: nextOverrides }
    })
  }

  // ─── Material selection handlers (implicit snapshot management) ──────────

  const updateSelectionMaterialId = useCallback(
    (category: string, materialType: MaterialType, newMaterialId: number) => {
      const key = getMaterialSelectionKey({ category, materialType })
      setEditingScopeDraft(prev => {
        if (!prev) return prev
        const selIdx = prev.materialSelections.findIndex(
          s =>
            getMaterialSelectionKey({
              category: s.category,
              materialType: s.materialType,
            }) === key,
        )
        if (selIdx < 0) return prev
        return {
          ...prev,
          materialSelections: prev.materialSelections.map((s, i) =>
            i === selIdx ? { ...s, materialId: newMaterialId } : s,
          ),
        }
      })
    },
    [],
  )

  const handleMaterialNameChange = useCallback(
    (category: string, materialType: MaterialType, newSku: string) => {
      const suppliers = getSuppliersForSku(
        materialCatalog,
        newSku,
        materialType,
      )
      const newMaterialId = suppliers[0]?.materialId ?? 0
      updateSelectionMaterialId(category, materialType, newMaterialId)
    },
    [materialCatalog, updateSelectionMaterialId],
  )

  const handleMaterialSupplierChange = useCallback(
    (category: string, materialType: MaterialType, newMaterialId: number) => {
      updateSelectionMaterialId(category, materialType, newMaterialId)
    },
    [updateSelectionMaterialId],
  )

  const updateSelectionOverrideValue = useCallback(
    (category: string, materialType: MaterialType, rawValue: string) => {
      const key = getMaterialSelectionKey({ category, materialType })
      setEditingScopeDraft(prev => {
        if (!prev) return prev
        return {
          ...prev,
          materialSelections: prev.materialSelections.map(s => {
            if (
              getMaterialSelectionKey({
                category: s.category,
                materialType: s.materialType,
              }) !== key
            )
              return s
            const nextValue =
              rawValue.trim() === ''
                ? undefined
                : reaisToCents(normalizeNumber(rawValue))
            const nextOverrides = { ...s.overrides }
            if (nextValue !== undefined) {
              nextOverrides.value = nextValue
            } else {
              delete nextOverrides.value
            }
            return { ...s, overrides: nextOverrides }
          }),
        }
      })
    },
    [],
  )

  const productMap = useMemo(
    () =>
      new Map(
        products.map(p => [
          Number(p.id),
          p as unknown as IncludeDatabaseDates<LibProduct>,
        ]),
      ),
    [products],
  )

  const scopeElements = useMemo(() => {
    const derivedElements = scopeRawElements.map(appendElementDerivedValues)
    const computedScopeElements = editingScopeDraft
      ? computedElementsLib.generateComputedElements(
          derivedElements,
          [editingScopeDraft as unknown as QuoteScope],
          productMap,
        )
      : []
    return [...derivedElements, ...computedScopeElements]
  }, [scopeRawElements, editingScopeDraft, productMap])

  useEffect(() => {
    setEditingScopeDraft(prev => {
      if (!prev) return prev
      const mergedSelections = deriveSelectionsFromElements(
        scopeElements,
        prev.materialSelections,
      )
      if (mergedSelections.length === prev.materialSelections.length)
        return prev
      return { ...prev, materialSelections: mergedSelections }
    })
  }, [scopeElements])

  const materialSnapshot = useMemo(
    () =>
      buildMaterialSnapshot(
        editingScopeDraft?.materialSelections ?? [],
        materialCatalog,
        (loadedScope?.materials as unknown as QuoteScopeMaterialSnapshotMap) ??
          {},
      ),
    [
      editingScopeDraft?.materialSelections,
      materialCatalog,
      loadedScope?.materials,
    ],
  )

  // ─── Scope save / cancel ─────────────────────────────────────────────────

  const persistScopeChanges = useCallback(async (): Promise<boolean> => {
    if (!editingScopeDraft?.id) {
      toast.error('Escopo inválido para salvar')
      return false
    }
    const scopeToSave = {
      ...editingScopeDraft,
      materialSelections: editingScopeDraft.materialSelections.filter(
        s => s.materialId,
      ),
    }
    await upsertQuoteScope(toPersistableScope(scopeToSave, materialSnapshot))

    const computedProductIds = new Set(
      scopeElements
        .filter(e => e.productId && !scopeRawElements.some(r => r.id === e.id))
        .map(e => String(e.productId)),
    )
    if (computedProductIds.size > 0) {
      const quoteResponse = await getQuoteById(quoteId)
      const existingProducts =
        (quoteResponse.data?.[0]
          ?.products as unknown as QuoteScopeProductSnapshotMap) ?? {}
      const nextProducts: QuoteScopeProductSnapshotMap = { ...existingProducts }
      let hasNew = false
      for (const productId of computedProductIds) {
        if (!nextProducts[productId]) {
          const product = products.find(p => String(p.id) === productId)
          if (product) {
            nextProducts[productId] = {
              ...product,
              id: Number(product.id),
              modifiers: product.modifiers ?? defaultProductModifiers,
              consumptionRates:
                product.consumptionRates ?? defaultProductConsumptionRates,
            }
            hasNew = true
          }
        }
      }
      if (hasNew) {
        await updateQuoteProducts({
          record: { id: quoteId, products: nextProducts },
        })
      }
    }

    return true
  }, [
    editingScopeDraft,
    materialSnapshot,
    scopeElements,
    scopeRawElements,
    quoteId,
    products,
  ])

  const saveScopeDraft = useCallback(async () => {
    setIsSaving(true)
    try {
      const saved = await persistScopeChanges()
      if (!saved) return
      const unlocked = await releaseScopeLock()
      if (!unlocked) return
      toast.success('Escopo atualizado com sucesso')
      allowBlockedNavigationRef.current = true
      backToQuote()
    } catch (error) {
      toast.error(
        (error as Error)?.message || 'Erro ao salvar alterações do escopo',
      )
    } finally {
      setIsSaving(false)
    }
  }, [backToQuote, persistScopeChanges, releaseScopeLock])

  // ─── Navigation save gate ────────────────────────────────────────────────

  const navigationBlocker = useBlocker(
    useCallback(
      () => scopeLockAcquired && !allowBlockedNavigationRef.current,
      [scopeLockAcquired],
    ),
  )

  useEffect(() => {
    if (navigationBlocker.state === 'blocked') {
      setIsLeaveGuardModalOpen(true)
    }
  }, [navigationBlocker.state])

  const proceedNavigation = useCallback(() => {
    allowBlockedNavigationRef.current = true
    if (navigationBlocker.state === 'blocked') {
      navigationBlocker.proceed()
    } else {
      backToQuote()
    }
  }, [backToQuote, navigationBlocker])

  const stayOnPage = useCallback(() => {
    if (navigationBlocker.state === 'blocked') {
      navigationBlocker.reset()
    }
    setIsLeaveGuardModalOpen(false)
  }, [navigationBlocker])

  const discardAndNavigate = useCallback(async () => {
    setIsResolvingLeave(true)
    try {
      const unlocked = await releaseScopeLock()
      if (!unlocked) return
      toast.info('Alterações do escopo descartadas')
      setIsLeaveGuardModalOpen(false)
      proceedNavigation()
    } finally {
      setIsResolvingLeave(false)
    }
  }, [releaseScopeLock, proceedNavigation])

  const saveAndNavigate = useCallback(async () => {
    setIsResolvingLeave(true)
    try {
      const saved = await persistScopeChanges()
      if (!saved) return
      const unlocked = await releaseScopeLock()
      if (!unlocked) return
      toast.success('Escopo atualizado com sucesso')
      setIsLeaveGuardModalOpen(false)
      proceedNavigation()
    } catch (error) {
      toast.error(
        (error as Error)?.message || 'Erro ao salvar alterações do escopo',
      )
    } finally {
      setIsResolvingLeave(false)
    }
  }, [persistScopeChanges, releaseScopeLock, proceedNavigation])

  // ─── Derived state ───────────────────────────────────────────────────────

  const fixedCostRows = useMemo(
    () =>
      toFixedCostRows(
        baseCosts,
        quoteRecord,
        editingScopeDraft ?? { overriddenFixedCosts: [] },
      ),
    [baseCosts, quoteRecord, editingScopeDraft?.overriddenFixedCosts],
  )

  const elementsGroupedByCategory = useMemo(
    () => elementsToGroupedElements(scopeElements),
    [scopeElements],
  )

  const enrichedGroupedElements = useMemo(() => {
    let groups = elementsGroupedByCategory
    groups = calculateGroupPercentageTotals({
      groupedElements: groups,
      productConsumption: resolveEffectiveConsumptionPercentages(
        groups,
        products,
        quoteRecord,
        editingScopeDraft,
      ),
    })
    return groups
  }, [
    elementsGroupedByCategory,
    products,
    quoteRecord,
    editingScopeDraft?.overriddenProductConsumption,
  ])

  const productConsumptionRows = useMemo(
    () =>
      deriveProductConsumptionFromGroups(
        elementsGroupedByCategory,
        editingScopeDraft?.overriddenProductConsumption || [],
        products,
        quoteRecord,
      ),
    [
      elementsGroupedByCategory,
      editingScopeDraft?.overriddenProductConsumption,
      products,
      quoteRecord,
    ],
  )

  const scopeSummaryRows = useMemo(
    () => toScopeSummaryRows(enrichedGroupedElements),
    [enrichedGroupedElements],
  )

  // ─── Render ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
          <CircularProgress sx={SPINNER_SX} size={56} />
          <p className="text-sm font-medium text-gray-600">
            Carregando escopo...
          </p>
        </div>
      </div>
    )
  }

  if (!editingScopeDraft) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <GenericModal
        isOpen={isLeaveGuardModalOpen}
        onClose={stayOnPage}
        title="Sair sem salvar?"
        showCancelButton={false}
        size="md"
      >
        <p className="text-sm text-gray-700">
          Você tem alterações não salvas neste escopo. Escolha como deseja
          prosseguir.
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
            onClick={() => {
              void discardAndNavigate()
            }}
            disabled={isResolvingLeave}
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Não salvar e sair
          </button>
          <button
            type="button"
            onClick={() => {
              void saveAndNavigate()
            }}
            disabled={isResolvingLeave}
            className="rounded bg-violet-500 px-3 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Salvar e sair
          </button>
        </div>
      </GenericModal>

      {/* Header */}
      <div className="border-b border-[#333333] bg-[#1a1a1a] text-white shadow-sm">
        <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-wide md:text-xl">
              {editingScopeDraft.name}
            </h1>
            <p className="mt-1 text-sm text-gray-300">
              Esta tela salva apenas os dados do escopo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsLeaveGuardModalOpen(true)}
            className="inline-flex items-center gap-2 rounded border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            <FiArrowLeft />
            Voltar ao orçamento
          </button>
        </div>
      </div>

      <main className="w-full px-4 py-4">
        {isReadOnly && (
          <div className="mb-4 rounded border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-600">
            Esta é uma versão somente leitura.
          </div>
        )}
        <fieldset disabled={isReadOnly} className="contents">
          <div className="space-y-6 rounded-lg bg-white p-4 shadow-sm">
            {/* ── Informações Gerais ── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Informações Gerais
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-gray-700">
                  Nome
                  <input
                    type="text"
                    value={editingScopeDraft.name || ''}
                    onChange={e => updateDraftField('name', e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Tipo de Fornecimento
                  <select
                    value={editingScopeDraft.supplyType || ''}
                    onChange={e =>
                      updateDraftField('supplyType', e.target.value)
                    }
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="">—</option>
                    <option value="fornecimento">Fornecimento</option>
                    <option value="complemento">Complemento</option>
                  </select>
                </label>
                <label className="text-sm text-gray-700">
                  Tipo de Pavimento
                  <select
                    value={editingScopeDraft.scopeType || ''}
                    onChange={e =>
                      updateDraftField('scopeType', e.target.value)
                    }
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="">—</option>
                    <option value="Tipo">Tipo</option>
                    <option value="Não Tipo">Não Tipo</option>
                    <option value="Outro">Outro</option>
                  </select>
                </label>
                <label className="text-sm text-gray-700">
                  Delimitação
                  <input
                    type="text"
                    value={editingScopeDraft.boundary || ''}
                    onChange={e => updateDraftField('boundary', e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Pé Direito
                  <input
                    type="text"
                    value={editingScopeDraft.ceilingHeight || ''}
                    onChange={e =>
                      updateDraftField('ceilingHeight', e.target.value)
                    }
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Arquivo de Projeto
                  <input
                    type="text"
                    value={editingScopeDraft.projectFileName || ''}
                    onChange={e =>
                      updateDraftField('projectFileName', e.target.value)
                    }
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="text-sm text-gray-700">
                <p className="mb-1">Observações</p>
                <RichTextEditor
                  value={editingScopeDraft.observations || ''}
                  onChange={html => updateDraftField('observations', html)}
                  isEditing={true}
                />
              </div>
            </section>

            {/* ── Elementos (embedded) ── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Elementos
              </h3>

              <ElementsEditor
                quoteId={quoteId}
                scopeId={numericScopeId}
                onScopeElementsSaved={(
                  savedScopeElements: QuoteElementApiItem[],
                ) => {
                  setScopeRawElements(savedScopeElements)
                  setEditingScopeDraft(prev => {
                    if (!prev) return prev
                    const derivedElements = savedScopeElements.map(
                      appendElementDerivedValues,
                    )
                    const allElements = [
                      ...derivedElements,
                      ...computedElementsLib.generateComputedElements(
                        derivedElements,
                        [loadedScope as unknown as QuoteScope],
                        productMap,
                      ),
                    ]
                    return {
                      ...prev,
                      materialSelections: deriveSelectionsFromElements(
                        allElements,
                        prev.materialSelections,
                      ),
                    }
                  })
                }}
              />
            </section>

            {/* ── Resumo de Áreas ── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Resumo de Áreas
              </h3>
              <QuoteValuesTable
                columns={scopeSummaryColumns}
                rows={scopeSummaryRows}
                getRowType={row => row._rowType ?? 'body'}
                emptyText="Nenhum elemento vinculado a este escopo."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ['gastalhoCount', 'Gastalhos', 'jogo(s)'],
                    ['fundoAdicionalCount', 'Fundo Adicional', 'jogo(s)'],
                    ['tiraAdicionalCount', 'Tira Adicional', 'jogo(s)'],
                  ] as const
                ).map(([field, label, unit]) => (
                  <label
                    key={field}
                    className="text-xs font-medium uppercase tracking-wide text-gray-500"
                  >
                    {label}
                    <div className="mt-1 flex items-center overflow-hidden rounded border border-gray-300 bg-white">
                      <input
                        type="number"
                        min={0}
                        value={editingScopeDraft[field] ?? 0}
                        onChange={e =>
                          updateDraftField(
                            field,
                            Math.max(
                              0,
                              Number(e.target.value),
                            ) as EditableQuoteScope[typeof field],
                          )
                        }
                        className="w-full min-w-0 px-3 py-2 text-sm text-gray-800 focus:outline-none"
                      />
                      <span className="shrink-0 pr-3 text-sm normal-case text-gray-500">
                        {unit}
                      </span>
                    </div>
                  </label>
                ))}
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Garfos
                  <div className="mt-1 flex h-[38px] items-center gap-4 rounded bg-white px-1">
                    <label className="flex cursor-pointer items-center gap-2 text-sm normal-case font-normal text-gray-700">
                      <input
                        type="checkbox"
                        checked={editingScopeDraft.garfoBordaEnabled ?? false}
                        onChange={e =>
                          updateDraftField(
                            'garfoBordaEnabled',
                            e.target.checked,
                          )
                        }
                        className="h-5 w-5 cursor-pointer"
                      />
                      Borda
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm normal-case font-normal text-gray-700">
                      <input
                        type="checkbox"
                        checked={editingScopeDraft.garfoInternoEnabled ?? false}
                        onChange={e =>
                          updateDraftField(
                            'garfoInternoEnabled',
                            e.target.checked,
                          )
                        }
                        className="h-5 w-5 cursor-pointer"
                      />
                      Internas
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Configurações: Custos Fixos ── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Configurações — Custos Fixos
              </h3>
              <QuoteValuesTable
                mode="edit"
                columns={fixedCostColumns}
                rows={fixedCostRows}
                onRowChange={updateFixedCostRow}
                emptyText="Nenhum custo fixo disponível."
              />
            </section>

            {/* ── Configurações: Consumo de Produto ── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Configurações — Elementos
              </h3>
              <QuoteValuesTable
                mode="edit"
                columns={productConsumptionColumns}
                rows={productConsumptionRows}
                rowIdField="category"
                onRowChange={updateProductConsumptionRow}
                emptyText="Nenhum consumo disponível."
              />
            </section>

            {/* ── Material tables (one per MaterialType) ── */}
            {MaterialTypes.map(materialType => {
              const uniqueSkus = getUniqueSkusForType(
                materialCatalog,
                materialType,
              )
              const selectionsByKey = new Map(
                (editingScopeDraft.materialSelections || [])
                  .filter(s => s.materialType === materialType)
                  .map(s => [s.category, s]),
              )

              const typeOrder = ['pilar', 'viga', 'laje']
              const sortedCategories = Object.entries(
                elementsGroupedByCategory,
              ).sort(
                ([, a], [, b]) =>
                  typeOrder.indexOf(a.elements[0]?.type ?? '') -
                  typeOrder.indexOf(b.elements[0]?.type ?? ''),
              )

              const filteredSortedCategories = sortedCategories.filter(
                ([, group]) => {
                  const icKey = materialTypeToIcKey[materialType]
                  const elementProductId = group.elements[0]?.productId
                  const product = products.find(
                    p => Number(p.id) === Number(elementProductId),
                  )
                  if (!product) return false
                  const effectiveConsumption = getOverriddenProductConsumption({
                    product: product as unknown as LibProduct,
                    quote: quoteRecord ?? undefined,
                    scope: editingScopeDraft as unknown as QuoteScope,
                    overrideLevel: 'scope',
                  })
                  return (
                    normalizeNumber(
                      effectiveConsumption.consumptionRates[icKey],
                    ) > 0
                  )
                },
              )

              const tableRows: MaterialTableRow[] = []
              let lastType: string | null = null

              for (const [category, group] of filteredSortedCategories) {
                if (!category) continue
                const first = group.elements[0]
                if (!first) continue
                const elementType = first.type as QuoteElementType

                if (elementType !== lastType) {
                  lastType = elementType
                  tableRows.push({
                    _id: `group-${materialType}-${elementType}`,
                    _rowType: 'subheader',
                    elementLabel: sectionLabels[elementType] ?? elementType,
                    currentSku: '',
                    suppliersForSku: [],
                    materialId: 0,
                    quantity: 0,
                    unitValueOriginal: null,
                    overrideValueInput: '',
                    category,
                    materialType,
                  })
                }

                const selection = selectionsByKey.get(category)
                const materialId = selection?.materialId ?? 0
                const materialEntry = materialSnapshot[String(materialId)]
                const currentSku = materialEntry?.sku ?? ''
                const suppliersForSku = currentSku
                  ? getSuppliersForSku(
                      materialCatalog,
                      currentSku,
                      materialType,
                    )
                  : []
                const overrideCents = selection?.overrides?.value

                tableRows.push({
                  _id: getMaterialSelectionKey({ category, materialType }),
                  _rowType: 'body',
                  elementLabel: group.categoryName as string,
                  currentSku,
                  suppliersForSku,
                  materialId,
                  quantity: roundToTwo(group.quantity),
                  unitValueOriginal: materialEntry
                    ? centsToReais(
                        getOverriddenMaterialSelectionValue({
                          material: materialEntry,
                          scope: editingScopeDraft as unknown as QuoteScope,
                          category,
                          overriddenLevel: 'scope_snapshot',
                        }),
                      )
                    : null,
                  overrideValueInput:
                    overrideCents != null ? centsToReais(overrideCents) : '',
                  category,
                  materialType,
                })
              }

              const materialColumns: QuoteValuesTableColumn<MaterialTableRow>[] =
                [
                  {
                    key: 'element',
                    label: 'Elemento',
                    field: 'elementLabel',
                  },
                  {
                    key: 'material',
                    label: 'Material',
                    field: 'currentSku',
                    formatter: (value: string, row: MaterialTableRow) => (
                      <select
                        value={value}
                        onChange={e =>
                          handleMaterialNameChange(
                            row.category,
                            row.materialType,
                            e.target.value,
                          )
                        }
                        className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                      >
                        <option value="">—</option>
                        {uniqueSkus.map(({ name, sku }) => (
                          <option key={sku} value={sku}>
                            {name}
                          </option>
                        ))}
                      </select>
                    ),
                  },
                  {
                    key: 'fornecedor',
                    label: 'Fornecedor',
                    field: 'materialId',
                    formatter: (value: number, row: MaterialTableRow) => (
                      <select
                        value={value || ''}
                        onChange={e =>
                          handleMaterialSupplierChange(
                            row.category,
                            row.materialType,
                            Number(e.target.value),
                          )
                        }
                        disabled={!row.currentSku}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-50 disabled:text-gray-400 bg-white"
                      >
                        <option value="">—</option>
                        {row.suppliersForSku.map(s => (
                          <option key={s.materialId} value={s.materialId}>
                            {s.supplierName}
                          </option>
                        ))}
                      </select>
                    ),
                  },
                  {
                    key: 'quantity',
                    label: 'Quantidade',
                    field: 'quantity',
                    align: 'center',
                  },
                  {
                    key: 'overrideValue',
                    label: 'Valor',
                    field: 'overrideValueInput',
                    editable: true,
                    inputType: 'number',
                    align: 'right',
                    prefix: 'R$',
                    precision: 2,
                    placeholder: (row: MaterialTableRow) =>
                      row.unitValueOriginal != null
                        ? toLocalDecimal(row.unitValueOriginal, 2)
                        : '',
                  },
                ]

              return (
                <section key={materialType} className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                    {materialTypeLabels[materialType]}
                  </h3>
                  <QuoteValuesTable
                    columns={materialColumns}
                    rows={tableRows}
                    mode="edit"
                    rowIdField="_id"
                    getRowType={row => row._rowType}
                    emptyText="Nenhuma combinação de elementos para este escopo."
                    onRowChange={(rowId, _field, value) => {
                      const row = tableRows.find(r => r._id === rowId)
                      if (!row || row._rowType !== 'body') return
                      updateSelectionOverrideValue(
                        row.category,
                        row.materialType,
                        String(value),
                      )
                    }}
                  />
                </section>
              )
            })}

            {/* ── Action bar ── */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLeaveGuardModalOpen(true)}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <FiX />
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  void saveScopeDraft()
                }}
                disabled={isSaving || isReadOnly}
                className="inline-flex items-center gap-2 rounded bg-violet-500 px-3 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <FiSave />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </fieldset>
      </main>
    </div>
  )
}

export default ScopeEditPage
