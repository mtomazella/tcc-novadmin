import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { CircularProgress } from '@mui/material'
import { FiEdit2, FiSave, FiX } from 'react-icons/fi'
import { toast } from 'react-toastify'
import type {
  QuoteElementType,
  QuoteScopeProductSnapshotMap,
} from '@novadmin/lib/types'
import {
  appendElementDerivedValues,
  defaultValuesByType,
} from '@novadmin/lib/quote/elements'
import { computedElements as computedElementsLib } from '@novadmin/lib/quote'
import { sectionOrder, toManagedElements } from '../scopeEditHelpers'
import { getProducts } from 'services/api/productService'
import {
  batchUpsertQuoteElements,
  deleteQuoteElement,
  getQuoteById,
  getQuoteElements,
  getQuoteScopes,
  lockQuoteElements,
  unlockQuoteElements,
  updateQuoteProducts,
} from 'services/api/quoteService'
import {
  defaultProductConsumptionRates,
  defaultProductModifiers,
} from 'types/product'
import type { Product } from 'types/product'
import type { QuoteElementApiItem } from 'types/quote'
import { isNewElementInDefaultState, pickDefaultProductForType } from './shared'
import type { ManagedQuoteElement } from './shared'
import { ElementTypeSection } from './ElementTypeSection'
import QuoteElementImportButton from './import/QuoteElementImportButton'

const SPINNER_SX = { color: '#7C3AED' }

interface ElementsEditorProps {
  quoteId: number
  scopeId?: number
  onDirtyStateChange?: (isDirty: boolean) => void
  onScopeElementsSaved?: (rawScopeElements: QuoteElementApiItem[]) => void
  onUnassignedElementsChange?: (count: number) => void
  readOnly?: boolean
}

export interface ElementsEditorHandle {
  isEditing: () => boolean
  isSaving: () => boolean
  saveElements: () => Promise<boolean>
  cancelEditMode: () => Promise<boolean>
}

const createLocalId = (type: QuoteElementType, index: number) =>
  `${type}-${index}-${Date.now()}`

const sanitizeValuesForType = (
  type: QuoteElementType,
  values: Record<string, unknown>,
) => {
  const allowedKeys = new Set(Object.keys(defaultValuesByType[type]))

  return Object.entries(values || {}).reduce((accumulator, [key, value]) => {
    if (allowedKeys.has(key)) {
      accumulator[key] = value
    }

    return accumulator
  }, {} as Record<string, unknown>)
}

const applyComputedElementValues = (
  type: QuoteElementType,
  values: Record<string, unknown>,
) => {
  const derivedElement = appendElementDerivedValues({
    type,
    values,
  } as any)

  return derivedElement.values as Record<string, unknown>
}

const buildDraftSnapshot = (items: ManagedQuoteElement[]) =>
  Object.fromEntries(items.map(item => [item.localId, item]))

const ElementsEditor = forwardRef<ElementsEditorHandle, ElementsEditorProps>(
  function ElementsEditor(
    {
      quoteId,
      scopeId,
      onDirtyStateChange,
      onScopeElementsSaved,
      onUnassignedElementsChange,
      readOnly,
    }: ElementsEditorProps,
    ref,
  ) {
    const isScopeMode = Number.isFinite(scopeId)

    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isLocking, setIsLocking] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [products, setProducts] = useState<Product[]>([])
    const [allElements, setAllElements] = useState<ManagedQuoteElement[]>([])
    const [scopeElements, setScopeElements] = useState<ManagedQuoteElement[]>(
      [],
    )
    const [elementsLockState, setElementsLockState] = useState({
      isLocked: false,
      isLockedByAnotherUser: false,
    })

    const [collapsedSections, setCollapsedSections] = useState<
      Record<QuoteElementType, boolean>
    >({
      pilar: true,
      viga: true,
      laje: true,
      outro: true,
    })

    const [filterByType, setFilterByType] = useState<
      Record<QuoteElementType, 'todos' | 'inclusos'>
    >({
      pilar: 'inclusos',
      viga: 'inclusos',
      laje: 'inclusos',
      outro: 'inclusos',
    })

    const lockAcquiredRef = useRef(false)
    const draftElementsRef = useRef<Record<string, ManagedQuoteElement>>({})
    const originalElementIdsRef = useRef<number[]>([])
    const originalSnapshotRef = useRef<Record<string, ManagedQuoteElement>>({})

    useEffect(() => {
      onDirtyStateChange?.(isEditing)
    }, [isEditing, onDirtyStateChange])

    useEffect(() => {
      // Exclude trailing empty rows (added while editing so the user can add
      // new items) — they're blank placeholders, not real unassigned elements.
      const unassignedCount = allElements.filter(
        e => e.scopeId == null && !isNewElementInDefaultState(e),
      ).length
      onUnassignedElementsChange?.(unassignedCount)
    }, [allElements, onUnassignedElementsChange])

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        isEditing: () => isEditing,
        isSaving: () => isSaving,
        saveElements: async () => {
          if (isSaving || !isEditing) return false
          await saveElements()
          return true
        },
        cancelEditMode: async () => {
          if (isEditing) {
            await cancelEditMode()
            return true
          }
          return true
        },
      }),
      [isEditing, isSaving],
    )

    // Release lock when component unmounts if still holding it
    useEffect(() => {
      return () => {
        if (lockAcquiredRef.current) {
          const cleanup = async () => {
            try {
              await unlockQuoteElements({ id: quoteId })
            } catch (err) {
              console.error('Failed to release element lock on unmount:', err)
            }
          }
          void cleanup()
        }
      }
    }, [quoteId])

    const refreshElementsLockState = useCallback(async () => {
      const response = await getQuoteById(quoteId)
      const freshQuote = response.data?.[0] ?? null

      const nextLockState = {
        isLocked: Boolean(freshQuote?.isElementsLocked),
        isLockedByAnotherUser: Boolean(
          freshQuote?.isElementsLockedByAnotherUser,
        ),
      }

      setElementsLockState(nextLockState)
      return nextLockState
    }, [quoteId])

    const loadData = useCallback(async () => {
      setIsLoading(true)

      try {
        if (isScopeMode) {
          const [scopeResponse, allResponse, productsResponse] =
            await Promise.all([
              getQuoteElements({
                quoteId,
                scopeId,
                activationStatus: 'active',
                includeProduct: true,
                includeScope: true,
              }),
              getQuoteElements({
                quoteId,
                activationStatus: 'active',
                includeScope: true,
              }),
              getProducts({ page: 1, limit: 1000, order: 'name' }),
            ])

          const managedScope = toManagedElements(scopeResponse.data || [])
          const managedAll = toManagedElements(allResponse.data || [])

          setScopeElements(managedScope)
          setAllElements(managedAll)
          setProducts(productsResponse.data || [])
        } else {
          const [elementsResponse, productsResponse] = await Promise.all([
            getQuoteElements({
              quoteId,
              includeProduct: true,
              includeProductName: true,
              includeScope: true,
              activationStatus: 'active',
              order: 'name',
            }),
            getProducts({ page: 1, limit: 1000, order: 'name' }),
          ])

          const managed = (elementsResponse.data || []).map(
            (element, index) => ({
              ...element,
              localId: createLocalId(element.type as QuoteElementType, index),
              values: (element.values || {}) as Record<string, unknown>,
            }),
          ) as ManagedQuoteElement[]

          setAllElements(managed)
          setProducts(productsResponse.data || [])
        }

        await refreshElementsLockState()
      } catch (error) {
        toast.error((error as Error)?.message || 'Erro ao carregar elementos')
      } finally {
        setIsLoading(false)
      }
    }, [isScopeMode, quoteId, refreshElementsLockState, scopeId])

    useEffect(() => {
      void loadData()
    }, [loadData])

    const createEmptyElement = useCallback(
      (type: QuoteElementType, index: number) => {
        const filteredProducts = products.filter(
          product =>
            product.typeOnQuote === type ||
            product.typeOnQuote === 'outro' ||
            product.typeOnQuote == null,
        )
        const fallbackProduct = pickDefaultProductForType(
          type,
          filteredProducts,
        )

        const nonZeroDefaultValues = Object.fromEntries(
          Object.entries(defaultValuesByType[type]).filter(
            ([, value]) => value !== 0,
          ),
        )

        return {
          localId: createLocalId(type, index),
          quoteId,
          scopeId: null,
          productId: fallbackProduct?.id ? Number(fallbackProduct.id) : 0,
          type,
          name: '',
          values: nonZeroDefaultValues,
        } as ManagedQuoteElement
      },
      [products, quoteId],
    )

    const ensureTrailingEmptyRows = useCallback(
      (source: ManagedQuoteElement[]) => {
        const result: ManagedQuoteElement[] = []

        sectionOrder.forEach(type => {
          const typedElements = source.filter(element => element.type === type)
          const nonPlaceholderElements = typedElements.filter(
            element => !isNewElementInDefaultState(element),
          )
          const firstPlaceholder = typedElements.find(element =>
            isNewElementInDefaultState(element),
          )

          result.push(...nonPlaceholderElements)
          result.push(
            firstPlaceholder ||
              createEmptyElement(type, nonPlaceholderElements.length),
          )
        })

        return result
      },
      [createEmptyElement],
    )

    const toggleSectionCollapse = useCallback((type: QuoteElementType) => {
      setCollapsedSections(prev => ({ ...prev, [type]: !prev[type] }))
    }, [])

    const draftChangeElement = useCallback(
      (localId: string, element: ManagedQuoteElement) => {
        draftElementsRef.current[localId] = element
      },
      [],
    )

    const commitDraftElement = useCallback(
      (localId: string, element: ManagedQuoteElement) => {
        setAllElements(prev => {
          const next = prev.map(current =>
            current.localId === localId ? element : current,
          )
          const normalized =
            !isScopeMode && isEditing ? ensureTrailingEmptyRows(next) : next
          draftElementsRef.current = buildDraftSnapshot(normalized)
          return normalized
        })
      },
      [ensureTrailingEmptyRows, isEditing, isScopeMode],
    )

    const commitDraftElementsBatch = useCallback(
      (updates: Array<{ localId: string; element: ManagedQuoteElement }>) => {
        if (updates.length === 0) return

        setAllElements(prev => {
          const elementByLocalId = new Map(
            updates.map(update => [update.localId, update.element]),
          )
          const next = prev.map(
            current => elementByLocalId.get(current.localId) ?? current,
          )
          const normalized =
            !isScopeMode && isEditing ? ensureTrailingEmptyRows(next) : next
          draftElementsRef.current = buildDraftSnapshot(normalized)
          return normalized
        })
      },
      [ensureTrailingEmptyRows, isEditing, isScopeMode],
    )

    const removeElement = useCallback(
      (localId: string) => {
        setAllElements(prev => {
          const next = prev.filter(element => element.localId !== localId)
          const normalized =
            !isScopeMode && isEditing ? ensureTrailingEmptyRows(next) : next
          draftElementsRef.current = buildDraftSnapshot(normalized)
          return normalized
        })
      },
      [ensureTrailingEmptyRows, isEditing, isScopeMode],
    )

    const enableEditMode = useCallback(async () => {
      if (isLocking || isSaving) return

      try {
        const freshLockState = await refreshElementsLockState()

        if (freshLockState.isLocked) {
          toast.error(
            freshLockState.isLockedByAnotherUser
              ? 'Os elementos estão sendo editados por outro usuário.'
              : 'Os elementos já estão em edição por você em outra tela.',
          )
          return
        }

        setIsLocking(true)
        await lockQuoteElements({ id: quoteId })
        lockAcquiredRef.current = true

        const normalized = !isScopeMode
          ? ensureTrailingEmptyRows(allElements)
          : allElements

        setAllElements(normalized)
        originalElementIdsRef.current = normalized
          .filter(element => element.id)
          .map(element => element.id as number)
        originalSnapshotRef.current = buildDraftSnapshot(normalized)
        draftElementsRef.current = buildDraftSnapshot(normalized)

        setIsEditing(true)
        setElementsLockState({ isLocked: true, isLockedByAnotherUser: false })
      } catch (error) {
        toast.error(
          (error as Error)?.message || 'Não foi possível bloquear os elementos',
        )
      } finally {
        setIsLocking(false)
      }
    }, [
      allElements,
      ensureTrailingEmptyRows,
      isLocking,
      isSaving,
      isScopeMode,
      quoteId,
      refreshElementsLockState,
    ])

    const releaseLock = useCallback(async () => {
      if (!lockAcquiredRef.current) return true

      try {
        await unlockQuoteElements({ id: quoteId })
        lockAcquiredRef.current = false
        await refreshElementsLockState()
        return true
      } catch (error) {
        toast.error(
          (error as Error)?.message ||
            'Não foi possível desbloquear os elementos',
        )
        return false
      }
    }, [quoteId, refreshElementsLockState])

    const cancelEditMode = useCallback(async () => {
      const unlocked = await releaseLock()
      if (!unlocked) return

      setIsEditing(false)
      await loadData()
    }, [loadData, releaseLock])

    const saveElements = useCallback(async () => {
      setIsSaving(true)

      try {
        const currentElements = allElements.map(
          element => draftElementsRef.current[element.localId] || element,
        )

        const editedElements = currentElements.filter(element => {
          const original = originalSnapshotRef.current[element.localId]
          if (!original) return true
          return JSON.stringify(original) !== JSON.stringify(element)
        })

        const elementsToPersist = editedElements.filter(
          element => !isNewElementInDefaultState(element),
        )

        const removedIds = originalElementIdsRef.current.filter(
          elementId =>
            !currentElements.some(element => element.id === elementId),
        )

        const records = elementsToPersist.map(
          ({ localId: _local, ...element }) => ({
            ...element,
            quoteId,
            scopeId: element.scopeId ?? null,
            values: applyComputedElementValues(
              element.type as QuoteElementType,
              sanitizeValuesForType(
                element.type as QuoteElementType,
                (element.values || {}) as Record<string, unknown>,
              ),
            ),
          }),
        ) as QuoteElementApiItem[]

        if (records.length > 0) {
          await batchUpsertQuoteElements(records)
        }

        if (removedIds.length > 0) {
          await Promise.all(
            removedIds.map(elementId => deleteQuoteElement({ id: elementId })),
          )
        }

        const survivingElements = currentElements.filter(
          e =>
            !removedIds.includes(e.id ?? -1) && !isNewElementInDefaultState(e),
        )

        // Computed elements (Garfo, Gastalho, etc.) are never part of
        // survivingElements — they're generated at read time — but their
        // products still need a snapshot entry, or downstream calculations
        // (Values tab, document preview) silently treat them as absent.
        const scopesForComputedElements = await getQuoteScopes({
          quoteId,
          activationStatus: 'active',
        })
        const derivedSurvivingElements = survivingElements.map(element =>
          appendElementDerivedValues(element as any),
        )
        const computedSurvivingElements =
          computedElementsLib.generateComputedElements(
            derivedSurvivingElements as any,
            scopesForComputedElements.data ?? [],
          )

        const usedProductIds = new Set(
          [...survivingElements, ...computedSurvivingElements]
            .map(e => e.productId)
            .filter(Boolean)
            .map(String),
        )
        if (usedProductIds.size > 0) {
          const quoteResponse = await getQuoteById(quoteId)
          const existing =
            (quoteResponse.data?.[0]
              ?.products as unknown as QuoteScopeProductSnapshotMap) ?? {}
          const catalogById = new Map(products.map(p => [String(p.id), p]))
          const nextProducts: QuoteScopeProductSnapshotMap = { ...existing }
          let hasNew = false
          for (const id of usedProductIds) {
            if (!nextProducts[id]) {
              const p = catalogById.get(id)
              if (p) {
                nextProducts[id] = {
                  ...p,
                  id: Number(p.id),
                  modifiers: p.modifiers ?? defaultProductModifiers,
                  consumptionRates:
                    p.consumptionRates ?? defaultProductConsumptionRates,
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

        const unlocked = await releaseLock()
        if (!unlocked) return

        setIsEditing(false)
        await loadData()

        if (isScopeMode && scopeId) {
          const freshScopeElements = await getQuoteElements({
            quoteId,
            scopeId,
            activationStatus: 'active',
            includeProduct: true,
            includeScope: true,
          })
          onScopeElementsSaved?.(freshScopeElements.data || [])
        }

        toast.success('Elementos salvos com sucesso')
      } catch (error) {
        toast.error((error as Error)?.message || 'Erro ao salvar elementos')
      } finally {
        setIsSaving(false)
      }
    }, [
      allElements,
      isScopeMode,
      loadData,
      onScopeElementsSaved,
      products,
      quoteId,
      releaseLock,
      scopeId,
    ])

    const productsByType = useMemo(
      () =>
        sectionOrder.reduce((accumulator, type) => {
          accumulator[type] = products.filter(
            product =>
              product.typeOnQuote === type ||
              product.typeOnQuote === 'outro' ||
              product.typeOnQuote == null,
          )
          return accumulator
        }, {} as Record<QuoteElementType, Product[]>),
      [products],
    )

    const groupedScopeElements = useMemo(
      () =>
        sectionOrder.reduce((accumulator, type) => {
          const source =
            isEditing && Number.isFinite(scopeId)
              ? allElements.filter(element => element.scopeId === scopeId)
              : scopeElements

          accumulator[type] = source.filter(element => element.type === type)
          return accumulator
        }, {} as Record<QuoteElementType, ManagedQuoteElement[]>),
      [allElements, isEditing, scopeElements, scopeId],
    )

    const groupedAllElements = useMemo(
      () =>
        sectionOrder.reduce((accumulator, type) => {
          accumulator[type] = allElements.filter(
            element => element.type === type,
          )
          return accumulator
        }, {} as Record<QuoteElementType, ManagedQuoteElement[]>),
      [allElements],
    )

    const groupedQuoteElements = useMemo(() => {
      const source = isEditing
        ? ensureTrailingEmptyRows(allElements)
        : allElements.filter(element => !isNewElementInDefaultState(element))

      return sectionOrder.reduce((accumulator, type) => {
        accumulator[type] = source.filter(element => element.type === type)
        return accumulator
      }, {} as Record<QuoteElementType, ManagedQuoteElement[]>)
    }, [allElements, ensureTrailingEmptyRows, isEditing])

    const visibleElements = useMemo(() => {
      if (!isScopeMode) return groupedQuoteElements

      return sectionOrder.reduce((accumulator, type) => {
        const source =
          filterByType[type] === 'todos'
            ? groupedAllElements[type]
            : groupedScopeElements[type]
        accumulator[type] = source || []
        return accumulator
      }, {} as Record<QuoteElementType, ManagedQuoteElement[]>)
    }, [
      filterByType,
      groupedAllElements,
      groupedQuoteElements,
      groupedScopeElements,
      isScopeMode,
    ])

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-16">
          <CircularProgress sx={SPINNER_SX} size={48} />
          <p className="text-sm font-medium text-gray-600">
            Carregando elementos...
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              {readOnly ? (
                <>
                  Esta é uma versão somente leitura. Os elementos não podem ser
                  editados.
                </>
              ) : !isEditing ? (
                <>
                  Use o botão "Editar Elementos" para modificar os elementos.
                  <br />
                  Durante a edição, os elementos ficam bloqueados para evitar
                  alterações simultâneas.
                </>
              ) : (
                <>
                  Você está em modo de edição.
                  <br />
                  Clique em "Salvar" para aplicar as alterações ou em "Cancelar"
                  para descartar.
                </>
              )}
            </div>

            {!isEditing && !readOnly ? (
              <div className="flex items-center gap-2">
                {!isScopeMode && (
                  <QuoteElementImportButton
                    quoteId={quoteId}
                    products={products}
                    onImported={() => {
                      void loadData()
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    void enableEditMode()
                  }}
                  disabled={isLocking || isSaving || elementsLockState.isLocked}
                  className="inline-flex items-center gap-2 rounded bg-violet-500 px-3 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <FiEdit2 />
                  Editar Elementos
                </button>
              </div>
            ) : !isEditing ? null : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void cancelEditMode()
                  }}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <FiX />
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void saveElements()
                  }}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded bg-violet-500 px-3 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <FiSave />
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            )}
          </div>
        </div>

        {sectionOrder.map(type => (
          <ElementTypeSection
            key={type}
            type={type}
            sectionElements={visibleElements[type] || []}
            isCollapsed={collapsedSections[type]}
            isEditing={isEditing}
            scopeId={scopeId}
            productOptions={productsByType[type] || []}
            useFilter={isScopeMode}
            filter={filterByType[type]}
            showSelectionCheckbox={isScopeMode}
            showScopeColumn={!isScopeMode || isEditing}
            onFilterChange={filter =>
              setFilterByType(prev => ({ ...prev, [type]: filter }))
            }
            onToggleCollapse={toggleSectionCollapse}
            onRemoveElement={removeElement}
            onDraftChange={draftChangeElement}
            onCommitDraft={commitDraftElement}
            onCommitDraftBatch={commitDraftElementsBatch}
          />
        ))}
      </div>
    )
  },
)

export default ElementsEditor
