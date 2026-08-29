import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from 'react-toastify'
import type {
  IncludeDatabaseDates,
  Product,
  Quote,
  QuoteElement,
  QuoteFixedCost,
  QuoteFixedCostValueType,
  QuotePricingOption,
  QuoteProductConsumption,
  QuoteScope,
} from '@novadmin/lib/types'
import {
  elementsToGroupedElements,
  calculateGroupPercentageTotals,
} from '@novadmin/lib/quote/groupedElements'
import {
  appendElementDerivedValues,
  filterElementsAssignedToScope,
} from '@novadmin/lib/quote/elements'
import {
  computedElements as computedElementsLib,
  costSummary as costSummaryLib,
  materials,
  pricingOptions as pricingOptionsLib,
} from '@novadmin/lib/quote'
import type { CostSummaryResult } from '@novadmin/lib/quote/costSummary'
import type { QuotePricingOptionRow } from '@novadmin/lib/quote/pricingOptions'
import {
  normalizeNumber,
  percentToDecimal,
  reaisToCents,
} from '@novadmin/lib/utils/unitConversion'
import type { TabLeaveGuardHandle } from './ElementsTab'
import { getFixedCosts } from 'services/api/fixedCostService'
import { getPricingOptions } from 'services/api/pricingOptionService'
import { getProducts } from 'services/api/productService'
import {
  getQuoteById,
  getQuoteElements,
  getQuoteScopes,
  lockQuoteCosts,
  unlockQuoteCosts,
  updateQuoteFixedCosts,
} from 'services/api/quoteService'
import {
  deriveProductConsumptionFromGroups,
  resolveEffectiveConsumptionPercentages,
  toFixedCostRows,
} from 'pages/quote/edit/scopeEditHelpers'
import CostSummarySection from './values/CostSummarySection'
import QuotePricingOptionsSection from './values/QuotePricingOptionsSection'
import QuoteMaterialsSection from './values/QuoteMaterialsSection'
import QuoteFixedCostsSection from './values/QuoteFixedCostsSection'
import QuoteElementsSection from './values/QuoteElementsSection'

interface ValuesTabProps {
  quoteId: number
  onDirtyStateChange?: (dirty: boolean) => void
  readOnly?: boolean
}

// ── ValuesTab ─────────────────────────────────────────────────────────────────

const ValuesTab = forwardRef<TabLeaveGuardHandle, ValuesTabProps>(
  function ValuesTab({ quoteId, onDirtyStateChange, readOnly }, ref) {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [baseCosts, setBaseCosts] = useState<QuoteFixedCost[]>([])
    const [quoteRecord, setQuoteRecord] = useState<Quote | null>(null)

    const [isCostsEditing, setIsCostsEditing] = useState(false)
    const [costsLockAcquired, setCostsLockAcquired] = useState(false)
    const costsLockAcquiredRef = useRef(false)

    const [quoteElements, setQuoteElements] = useState<QuoteElement[]>([])
    const [scopes, setScopes] = useState<QuoteScope[]>([])
    const [allProducts, setAllProducts] = useState<
      IncludeDatabaseDates<Product>[]
    >([])

    const [fixedCostsDraft, setFixedCostsDraft] = useState<QuoteFixedCost[]>([])
    const [productConsumptionDraft, setProductConsumptionDraft] = useState<
      QuoteProductConsumption[]
    >([])
    const [basePricingOptions, setBasePricingOptions] = useState<
      QuotePricingOption[]
    >([])
    const [pricingOptionsDraft, setPricingOptionsDraft] = useState<
      QuotePricingOption[]
    >([])
    const [selectedPricingOptionIdDraft, setSelectedPricingOptionIdDraft] =
      useState<string | null>(null)

    // ── Data loading ────────────────────────────────────────────────────────

    useEffect(() => {
      void (async () => {
        setIsLoading(true)
        try {
          const [
            costsResponse,
            pricingOptionsResponse,
            quoteResponse,
            elementsResponse,
            scopesResponse,
            productsResponse,
          ] = await Promise.all([
            getFixedCosts({ limit: 1000, order: 'name' }),
            getPricingOptions({ limit: 1000, order: 'name' }),
            getQuoteById(quoteId),
            getQuoteElements({
              quoteId,
              activationStatus: 'active',
              includeProduct: true,
            }),
            getQuoteScopes({
              quoteId,
              activationStatus: 'active',
            }),
            getProducts({ limit: 1000 }),
          ])
          setBaseCosts(
            (costsResponse.data || []) as unknown as QuoteFixedCost[],
          )
          setBasePricingOptions(
            (pricingOptionsResponse.data || []).map(opt => ({
              id: String(opt.id),
              name: opt.name,
              valueReto: opt.valueReto,
              valueCambotado: opt.valueCambotado,
              valueGarfo: opt.valueGarfo,
            })),
          )
          setQuoteRecord(
            (quoteResponse.data?.[0] ?? null) as unknown as Quote | null,
          )
          setQuoteElements(
            (elementsResponse.data || []) as unknown as QuoteElement[],
          )
          setScopes((scopesResponse.data || []) as unknown as QuoteScope[])
          setAllProducts(
            (productsResponse.data ||
              []) as unknown as IncludeDatabaseDates<Product>[],
          )
        } catch (error) {
          toast.error(
            (error as Error)?.message || 'Erro ao carregar dados de custos',
          )
        } finally {
          setIsLoading(false)
        }
      })()
    }, [quoteId])

    // ── Dirty state propagation ─────────────────────────────────────────────

    useEffect(() => {
      onDirtyStateChange?.(costsLockAcquired)
    }, [costsLockAcquired, onDirtyStateChange])

    // ── Lock helpers ────────────────────────────────────────────────────────

    const releaseCostsLock = useCallback(async (): Promise<boolean> => {
      if (!costsLockAcquiredRef.current) return true
      try {
        await unlockQuoteCosts({ id: quoteId })
        costsLockAcquiredRef.current = false
        setCostsLockAcquired(false)
        return true
      } catch (error) {
        toast.error(
          (error as Error)?.message || 'Não foi possível desbloquear os custos',
        )
        return false
      }
    }, [quoteId])

    // ── Edit / Save / Cancel ────────────────────────────────────────────────

    const handleStartEditing = async () => {
      try {
        await lockQuoteCosts({ id: quoteId })
        costsLockAcquiredRef.current = true
        setCostsLockAcquired(true)
        setFixedCostsDraft(
          (quoteRecord?.fixedCosts as unknown as QuoteFixedCost[]) || [],
        )
        setProductConsumptionDraft(
          (quoteRecord?.productConsumption as unknown as QuoteProductConsumption[]) ||
            [],
        )
        const snapshot = (
          (quoteRecord?.pricingOptions as unknown as any[]) ?? []
        ).map(
          (opt): QuotePricingOption => ({
            ...opt,
            id: opt.id !== undefined ? String(opt.id) : undefined,
          }),
        )
        setPricingOptionsDraft(
          snapshot.length > 0
            ? snapshot
            : basePricingOptions.map(opt => ({ ...opt })),
        )
        setSelectedPricingOptionIdDraft(
          quoteRecord?.selectedPricingOptionId ?? null,
        )
        setIsCostsEditing(true)
      } catch (error) {
        toast.error(
          (error as Error)?.message || 'Não foi possível bloquear os custos',
        )
      }
    }

    const handleSaveCosts = useCallback(async (): Promise<boolean> => {
      setIsSaving(true)
      try {
        const updated = await updateQuoteFixedCosts({
          record: {
            id: quoteId,
            fixedCosts: fixedCostsDraft,
            pricingOptions: pricingOptionsDraft,
            selectedPricingOptionId: selectedPricingOptionIdDraft,
            productConsumption: productConsumptionDraft
              .filter(
                entry =>
                  entry.commercialPercentage !== null ||
                  entry.projectPercentage !== null ||
                  Object.values(entry.consumptionRates).some(v => v !== null),
              )
              .map(entry => ({
                id: entry.id,
                category: entry.category,
                ...(entry.commercialPercentage !== null && {
                  commercialPercentage: entry.commercialPercentage,
                }),
                ...(entry.projectPercentage !== null && {
                  projectPercentage: entry.projectPercentage,
                }),
                consumptionRates: Object.fromEntries(
                  Object.entries(entry.consumptionRates).filter(
                    ([, v]) => v !== null,
                  ),
                ),
              })) as unknown as QuoteProductConsumption[],
          },
        })
        setQuoteRecord((updated?.[0] ?? null) as unknown as Quote | null)
        await releaseCostsLock()
        setIsCostsEditing(false)
        setProductConsumptionDraft([])
        setPricingOptionsDraft([])
        toast.success('Custos atualizados com sucesso')
        return true
      } catch (error) {
        toast.error((error as Error)?.message || 'Erro ao salvar custos')
        return false
      } finally {
        setIsSaving(false)
      }
    }, [
      fixedCostsDraft,
      pricingOptionsDraft,
      selectedPricingOptionIdDraft,
      productConsumptionDraft,
      quoteId,
      releaseCostsLock,
    ])

    const handleCancelCosts = useCallback(async (): Promise<boolean> => {
      const released = await releaseCostsLock()
      if (released) {
        setIsCostsEditing(false)
        setProductConsumptionDraft([])
        setPricingOptionsDraft([])
      }
      return released
    }, [releaseCostsLock])

    // ── Row change handlers ─────────────────────────────────────────────────

    const updateFixedCostRow = (
      rowId: string | number,
      field: string,
      value: unknown,
    ) => {
      if (field !== 'value') return
      const baseCost = baseCosts.find(c => c.id === rowId)
      if (!baseCost) return
      setFixedCostsDraft(prev => {
        if (value === '') return prev.filter(c => c.id !== rowId)
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
        const idx = prev.findIndex(c => c.id === rowId)
        return idx >= 0
          ? prev.map((c, i) => (i === idx ? updated : c))
          : [...prev, updated]
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
      setProductConsumptionDraft(prev => {
        const idx = prev.findIndex(item => item.category === category)
        const current =
          idx >= 0
            ? prev[idx]
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
        return idx >= 0
          ? prev.map((item, i) => (i === idx ? updated : item))
          : [...prev, updated]
      })
    }

    // ── Pricing option row handlers ─────────────────────────────────────────

    const updatePricingOptionRow = (
      id: string,
      field: string,
      value: unknown,
    ) => {
      setPricingOptionsDraft(prev =>
        prev.map(opt => {
          if (opt.id !== id) return opt
          if (field === 'name') return { ...opt, name: String(value) }
          if (value === '' || value === null || value === undefined) {
            const base = basePricingOptions.find(b => String(b.id) === id)
            return { ...opt, [field]: base?.[field as keyof typeof base] ?? 0 }
          }
          return { ...opt, [field]: reaisToCents(normalizeNumber(value)) }
        }),
      )
    }

    const addPricingOptionRow = () => {
      const newId =
        pricingOptionsLib.generateNextQuoteSpecificOptionId(pricingOptionsDraft)
      setPricingOptionsDraft(prev => [
        ...prev,
        { id: newId, name: '', valueReto: 0, valueCambotado: 0, valueGarfo: 0 },
      ])
    }

    const deletePricingOptionRow = (id: string) => {
      setPricingOptionsDraft(prev => prev.filter(opt => opt.id !== id))
      if (selectedPricingOptionIdDraft === id)
        setSelectedPricingOptionIdDraft(null)
    }

    // ── Derived rows ────────────────────────────────────────────────────────

    const pricingOptionRows = useMemo((): QuotePricingOptionRow[] => {
      if (isCostsEditing) {
        return pricingOptionsDraft.map(opt => {
          const base = basePricingOptions.find(b => b.id === opt.id)
          return {
            id: opt.id!,
            name: opt.name,
            description: opt.description,
            valueReto: opt.valueReto,
            valueCambotado: opt.valueCambotado,
            valueGarfo: opt.valueGarfo,
            baseValueReto: base?.valueReto,
            baseValueCambotado: base?.valueCambotado,
            baseValueGarfo: base?.valueGarfo,
            isQuoteSpecific: opt.id?.startsWith('quote-') ?? true,
          }
        })
      }
      const savedOpts = (
        (quoteRecord?.pricingOptions as unknown as any[]) ?? []
      ).map(
        (opt): QuotePricingOption => ({
          ...opt,
          id: opt.id !== undefined ? String(opt.id) : undefined,
        }),
      )
      const sourceOpts = savedOpts.length > 0 ? savedOpts : basePricingOptions
      return sourceOpts.map(opt => ({
        id: opt.id!,
        name: opt.name,
        description: opt.description,
        valueReto: opt.valueReto,
        valueCambotado: opt.valueCambotado,
        valueGarfo: opt.valueGarfo,
        isQuoteSpecific: opt.id?.startsWith('quote-') ?? false,
      }))
    }, [
      basePricingOptions,
      isCostsEditing,
      pricingOptionsDraft,
      quoteRecord?.pricingOptions,
    ])

    const fixedCostRows = useMemo(
      () =>
        toFixedCostRows(baseCosts, null, {
          overriddenFixedCosts: fixedCostsDraft,
        }),
      [baseCosts, fixedCostsDraft],
    )

    const productMap = useMemo(
      () =>
        new Map(
          allProducts.map(p => [
            Number(p.id),
            p as unknown as IncludeDatabaseDates<Product>,
          ]),
        ),
      [allProducts],
    )

    const allQuoteElements = useMemo(() => {
      const scopedElements = filterElementsAssignedToScope(quoteElements)
      const derivedElements = scopedElements.map(appendElementDerivedValues)
      return [
        ...derivedElements,
        ...computedElementsLib.generateComputedElements(
          derivedElements,
          scopes,
          productMap,
        ),
      ]
    }, [quoteElements, scopes, productMap])

    const elementGroups = useMemo(
      () => elementsToGroupedElements(allQuoteElements),
      [allQuoteElements],
    )

    const elementGroupsByScope = useMemo(() => {
      const result: Record<
        number,
        ReturnType<typeof elementsToGroupedElements>
      > = {}
      for (const scope of scopes) {
        if (!scope.id) continue
        const scopeElements = allQuoteElements.filter(
          e => e.scopeId === scope.id,
        )
        result[scope.id] = elementsToGroupedElements(scopeElements)
      }
      return result
    }, [scopes, allQuoteElements])

    const effectiveQuoteRecord = useMemo(() => {
      if (!quoteRecord) return undefined
      if (!isCostsEditing) return quoteRecord
      return {
        ...quoteRecord,
        productConsumption: productConsumptionDraft,
      } as Quote
    }, [quoteRecord, isCostsEditing, productConsumptionDraft])

    const materialEntries = useMemo(
      () =>
        materials.calculateQuoteMaterialSummary({
          scopes,
          elementGroupsByScope,
          quote: effectiveQuoteRecord,
        }),
      [scopes, elementGroupsByScope, effectiveQuoteRecord],
    )

    const effectiveFixedCosts = useMemo(() => {
      const overrides = isCostsEditing
        ? fixedCostsDraft
        : quoteRecord?.fixedCosts ?? []
      const overrideMap = new Map(overrides.map(c => [c.id, c]))
      return baseCosts.map(c => overrideMap.get(c.id) ?? c)
    }, [baseCosts, fixedCostsDraft, isCostsEditing, quoteRecord?.fixedCosts])

    const totalProjectM2 = useMemo(() => {
      const effectiveConsumption = resolveEffectiveConsumptionPercentages(
        elementGroups,
        Object.values(effectiveQuoteRecord?.products ?? {}) as any[],
        (effectiveQuoteRecord as Quote | null) ?? null,
      )
      const enrichedGroups = calculateGroupPercentageTotals({
        groupedElements: elementGroups,
        productConsumption: effectiveConsumption,
      })
      return Object.values(enrichedGroups).reduce(
        (sum, group) => sum + (group.projectTotalM2 ?? 0),
        0,
      )
    }, [elementGroups, effectiveQuoteRecord])

    const costSummary = useMemo((): CostSummaryResult => {
      const selectedId = isCostsEditing
        ? selectedPricingOptionIdDraft
        : quoteRecord?.selectedPricingOptionId ?? null
      const selectedOption = selectedId
        ? pricingOptionRows.find(r => r.id === selectedId)
        : undefined
      return costSummaryLib.computeCostSummary({
        elementGroups,
        effectiveFixedCosts,
        selectedPricingOption: selectedOption,
        totalProjectM2,
        computedFixedCosts: [
          {
            id: 'materia-prima',
            name: 'Matéria Prima',
            value: materials.calculateTotalMaterialCost(materialEntries),
          },
        ],
      })
    }, [
      elementGroups,
      effectiveFixedCosts,
      pricingOptionRows,
      materialEntries,
      totalProjectM2,
      isCostsEditing,
      selectedPricingOptionIdDraft,
      quoteRecord?.selectedPricingOptionId,
    ])

    const productConsumptionRows = useMemo(
      () =>
        deriveProductConsumptionFromGroups(
          elementGroups,
          isCostsEditing
            ? productConsumptionDraft
            : (quoteRecord?.productConsumption as unknown as QuoteProductConsumption[]) ??
                [],
          Object.values(quoteRecord?.products ?? {}) as any[],
          null,
        ),
      [
        elementGroups,
        quoteRecord?.products,
        quoteRecord?.productConsumption,
        isCostsEditing,
        productConsumptionDraft,
      ],
    )

    // ── Tab-switch leave guard ──────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      isDirty: () => costsLockAcquiredRef.current,
      saveBeforeLeave: () => handleSaveCosts(),
      discardBeforeLeave: () => handleCancelCosts(),
    }))

    // ── Browser close guard ─────────────────────────────────────────────────

    useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (!costsLockAcquiredRef.current) return
        e.preventDefault()
      }
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () =>
        window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [])

    useEffect(() => {
      const handlePageHide = (e: PageTransitionEvent) => {
        if (!costsLockAcquiredRef.current || e.persisted) return
        const token = localStorage.getItem('authToken')
        const baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ?? ''
        fetch(`${baseUrl}/quote/unlock/costs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ id: quoteId }),
          keepalive: true,
        }).catch(() => {})
      }
      window.addEventListener('pagehide', handlePageHide)
      return () => window.removeEventListener('pagehide', handlePageHide)
    }, [quoteId])

    // ── Render ──────────────────────────────────────────────────────────────

    if (isLoading) return null

    return (
      <div className="space-y-10 p-6">
        <CostSummarySection costSummary={costSummary} />
        <QuotePricingOptionsSection
          rows={pricingOptionRows}
          selectedId={
            isCostsEditing
              ? selectedPricingOptionIdDraft
              : quoteRecord?.selectedPricingOptionId ?? null
          }
          totalM2Reto={costSummary.totalM2Reto}
          totalM2Cambotado={costSummary.totalM2Cambotado}
          totalGarfoQuantity={costSummary.totalGarfoQuantity}
          isEditing={isCostsEditing}
          isLockBlocked={
            (costsLockAcquired && !isCostsEditing) || Boolean(readOnly)
          }
          isSaving={isSaving}
          onStartEdit={handleStartEditing}
          onSave={handleSaveCosts}
          onCancel={handleCancelCosts}
          onRowChange={updatePricingOptionRow}
          onRowDelete={deletePricingOptionRow}
          onRowAdd={addPricingOptionRow}
          onSelectOption={setSelectedPricingOptionIdDraft}
        />
        <QuoteMaterialsSection entries={materialEntries} />
        <QuoteFixedCostsSection
          rows={fixedCostRows}
          isEditing={isCostsEditing}
          isLockBlocked={
            (costsLockAcquired && !isCostsEditing) || Boolean(readOnly)
          }
          isSaving={isSaving}
          onStartEdit={handleStartEditing}
          onRowChange={updateFixedCostRow}
          onSave={handleSaveCosts}
          onCancel={handleCancelCosts}
        />
        <QuoteElementsSection
          rows={productConsumptionRows}
          isEditing={isCostsEditing}
          isLockBlocked={
            (costsLockAcquired && !isCostsEditing) || Boolean(readOnly)
          }
          isSaving={isSaving}
          onStartEdit={handleStartEditing}
          onRowChange={updateProductConsumptionRow}
          onSave={handleSaveCosts}
          onCancel={handleCancelCosts}
        />
      </div>
    )
  },
)

export default ValuesTab
