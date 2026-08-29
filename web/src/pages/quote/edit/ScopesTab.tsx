import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import {
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material'
import {
  FiChevronDown,
  FiChevronRight,
  FiEdit2,
  FiLock,
  FiMoreVertical,
  FiPlus,
  FiTrash2,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import GenericModal from 'components/GenericModal'
import QuoteValuesTable from 'components/QuoteValuesTable'
import {
  deleteQuoteScope,
  getQuoteById,
  getQuoteElements,
  getQuoteScopes,
  upsertQuoteScope,
} from 'services/api/quoteService'
import { getProducts } from 'services/api/productService'
import type { IncludeDatabaseDates, Quote, Product } from '@novadmin/lib/types'
import { computedElements as computedElementsLib } from '@novadmin/lib/quote'
import type { QuoteScopeApiItem } from 'types/quote'
import type { TabLeaveGuardHandle } from './ElementsTab'
import {
  elementsToGroupedElements,
  calculateGroupPercentageTotals,
} from '@novadmin/lib/quote/groupedElements'
import { appendElementDerivedValues } from '@novadmin/lib/quote/elements'
import {
  type ScopeSummaryRow,
  scopeSummaryColumns,
  toScopeSummaryRows,
} from './scopeSummaryHelpers'
import { resolveEffectiveConsumptionPercentages } from './scopeEditHelpers'

const SPINNER_SX = { color: '#7C3AED' }

function ScopeInfo({
  label,
  value,
}: {
  label: string
  value?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-gray-800">{value ?? '-'}</p>
    </div>
  )
}

interface ScopesTabProps {
  quoteId: number
  reloadToken?: number
  readOnly?: boolean
}

const ScopesTab = forwardRef<TabLeaveGuardHandle, ScopesTabProps>(
  ({ quoteId, reloadToken = 0, readOnly }: ScopesTabProps, ref) => {
    const navigate = useNavigate()

    const [scopes, setScopes] = useState<QuoteScopeApiItem[]>([])
    const [quoteRecord, setQuoteRecord] = useState<Quote | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isRefreshingScopeActionTarget, setIsRefreshingScopeActionTarget] =
      useState(false)
    const [expandedScopeIds, setExpandedScopeIds] = useState<Set<number>>(
      new Set(),
    )
    const [scopeToDelete, setScopeToDelete] =
      useState<QuoteScopeApiItem | null>(null)
    const [scopeActionAnchorEl, setScopeActionAnchorEl] =
      useState<HTMLElement | null>(null)
    const [scopeActionTarget, setScopeActionTarget] =
      useState<QuoteScopeApiItem | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isScopeLockWarningModalOpen, setIsScopeLockWarningModalOpen] =
      useState(false)
    const [scopeLockWarningMessage, setScopeLockWarningMessage] = useState('')
    const [allProducts, setAllProducts] = useState<
      IncludeDatabaseDates<Product>[]
    >([])
    const [scopeSummaries, setScopeSummaries] = useState<
      Record<number, ScopeSummaryRow[]>
    >({})
    const [loadingSummaries, setLoadingSummaries] = useState<Set<number>>(
      new Set(),
    )
    const [isCreateScopeModalOpen, setIsCreateScopeModalOpen] = useState(false)
    const [newScopeName, setNewScopeName] = useState('')
    const [isCreatingScope, setIsCreatingScope] = useState(false)

    const loadScopes = useCallback(async () => {
      if (!Number.isFinite(quoteId)) {
        setScopes([])
        setIsLoading(false)
        return
      }

      try {
        const [scopeResponse, quoteResponse, productsResponse] =
          await Promise.all([
            getQuoteScopes({
              quoteId,
              activationStatus: 'active',
              order: 'name',
            }),
            getQuoteById(quoteId),
            getProducts({ limit: 1000 }),
          ])

        const nextScopes = scopeResponse.data ?? []
        setScopes(nextScopes)
        setQuoteRecord(
          (quoteResponse.data?.[0] ?? null) as unknown as Quote | null,
        )
        setAllProducts(
          (productsResponse.data ||
            []) as unknown as IncludeDatabaseDates<Product>[],
        )
        setScopeSummaries({})
      } catch (error) {
        const errorMessage =
          (error as Error)?.message || 'Erro ao carregar escopos'
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }, [quoteId])

    useEffect(() => {
      void loadScopes()
    }, [loadScopes])

    useEffect(() => {
      if (reloadToken === 0) {
        return
      }

      void loadScopes()
    }, [loadScopes, reloadToken])

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

    useImperativeHandle(
      ref,
      () => ({
        isDirty: () => false,
        saveBeforeLeave: async () => true,
        discardBeforeLeave: async () => true,
      }),
      [],
    )

    const refreshScopeActionTarget = useCallback(
      async (scopeId: number) => {
        setIsRefreshingScopeActionTarget(true)

        try {
          const response = await getQuoteScopes({
            quoteId,
            id: scopeId,
            activationStatus: 'active',
          })

          const freshScope = response.data?.[0] ?? null

          if (freshScope) {
            setScopeActionTarget(freshScope)
            setScopes(previous =>
              previous.map(scope =>
                scope.id === freshScope.id ? freshScope : scope,
              ),
            )
          }

          return freshScope
        } catch (error) {
          const errorMessage =
            (error as Error)?.message || 'Erro ao atualizar status do escopo'
          toast.error(errorMessage)
          return null
        } finally {
          setIsRefreshingScopeActionTarget(false)
        }
      },
      [quoteId],
    )

    const openScopeActions = (
      event: React.MouseEvent<HTMLElement>,
      scope: QuoteScopeApiItem,
    ) => {
      event.stopPropagation()

      if (!scope.id) {
        return
      }

      setScopeActionTarget(scope)
      setScopeActionAnchorEl(event.currentTarget)
      void refreshScopeActionTarget(scope.id)
    }

    const closeScopeActions = () => {
      setScopeActionAnchorEl(null)
      setScopeActionTarget(null)
    }

    const requestEdit = (id?: number) => {
      if (!id) {
        if (!scopeActionTarget?.id) {
          closeScopeActions()
          return
        }
        id = scopeActionTarget.id
      }

      void (async () => {
        const freshScope = await refreshScopeActionTarget(id)

        if (!freshScope) {
          closeScopeActions()
          return
        }

        if (freshScope.isLocked) {
          setScopeLockWarningMessage(
            freshScope.isLockedByAnotherUser
              ? 'Este escopo já está sendo editado por outro usuário. Aguarde a liberação antes de editar.'
              : 'Este escopo já está sendo editado por você em outra tela. Finalize a edição antes de abrir novamente.',
          )
          setIsScopeLockWarningModalOpen(true)
          closeScopeActions()
          return
        }

        closeScopeActions()
        navigate(`/orcamento/edit/${quoteId}/escopo/${freshScope.id}`)
      })()
    }

    const requestDeleteFromMenu = () => {
      if (scopeActionTarget) {
        setScopeToDelete(scopeActionTarget)
      }
      closeScopeActions()
    }

    const loadScopeSummary = useCallback(
      async (scopeId: number) => {
        if (scopeSummaries[scopeId] !== undefined) return
        setLoadingSummaries(prev => new Set(prev).add(scopeId))
        try {
          const response = await getQuoteElements({
            quoteId,
            scopeId,
            activationStatus: 'active',
            includeProduct: true,
          })
          const scope = scopes.find(s => s.id === scopeId)
          const apiElements = (response.data ?? []).map(
            appendElementDerivedValues,
          )
          const allScopeElements = scope
            ? [
                ...apiElements,
                ...computedElementsLib.generateComputedElements(
                  apiElements,
                  [scope],
                  productMap,
                ),
              ]
            : apiElements
          let grouped = elementsToGroupedElements(allScopeElements)
          const scopeProducts = Object.values(grouped)
            .map(g => g.elements[0]?.product)
            .filter((p): p is Product => p != null)
          grouped = calculateGroupPercentageTotals({
            groupedElements: grouped,
            productConsumption: resolveEffectiveConsumptionPercentages(
              grouped,
              scopeProducts,
              quoteRecord,
              scope,
            ),
          })
          setScopeSummaries(prev => ({
            ...prev,
            [scopeId]: toScopeSummaryRows(grouped),
          }))
        } catch {
          console.log(`Failed to load summary for scope ${scopeId}`)
        } finally {
          setLoadingSummaries(prev => {
            const next = new Set(prev)
            next.delete(scopeId)
            return next
          })
        }
      },
      [quoteId, quoteRecord, scopeSummaries, scopes, productMap],
    )

    const toggleScope = (scopeId?: number) => {
      if (!scopeId) {
        return
      }

      setExpandedScopeIds(prev => {
        const next = new Set(prev)

        if (next.has(scopeId)) {
          next.delete(scopeId)
        } else {
          next.add(scopeId)
          void loadScopeSummary(scopeId)
        }

        return next
      })
    }

    const confirmDelete = async () => {
      if (!scopeToDelete?.id) {
        setScopeToDelete(null)
        return
      }

      setIsDeleting(true)

      try {
        await deleteQuoteScope(scopeToDelete.id)
        toast.success('Escopo excluído com sucesso')
        setScopeToDelete(null)
        setIsRefreshing(true)
        await loadScopes()
      } catch (error) {
        const errorMessage =
          (error as Error)?.message || 'Erro ao excluir escopo'
        toast.error(errorMessage)
      } finally {
        setIsDeleting(false)
      }
    }

    const createNewScope = async () => {
      if (!newScopeName.trim()) {
        toast.error('Nome do escopo é obrigatório')
        return
      }

      setIsCreatingScope(true)

      try {
        await upsertQuoteScope({
          quoteId,
          name: newScopeName.trim(),
          overriddenFixedCosts: [],
          overriddenProductConsumption: [],
          materials: {},
          materialSelections: [],
        })
        toast.success('Escopo criado com sucesso')
        setNewScopeName('')
        setIsCreateScopeModalOpen(false)
        setIsRefreshing(true)
        await loadScopes()
      } catch (error) {
        const errorMessage = (error as Error)?.message || 'Erro ao criar escopo'
        toast.error(errorMessage)
      } finally {
        setIsCreatingScope(false)
      }
    }

    const scopeCards = useMemo(
      () =>
        scopes.map(scope => {
          const isExpanded = expandedScopeIds.has(scope.id ?? -1)

          return (
            <article
              key={scope.id ?? scope.name}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggleScope(scope.id)}
                onDoubleClick={() => requestEdit(scope.id)}
                className="flex w-full items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <FiChevronDown className="text-gray-600" />
                  ) : (
                    <FiChevronRight className="text-gray-600" />
                  )}
                  <div>
                    <h3 className="text-md font-semibold text-gray-800">
                      {scope.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {scope.isLocked && (
                    <FiLock size={14} className="text-gray-700" />
                  )}
                  <IconButton
                    size="small"
                    onClick={event => openScopeActions(event, scope)}
                    aria-label={`Ações do escopo ${scope.name}`}
                  >
                    <FiMoreVertical size={16} className="text-violet-500" />
                  </IconButton>
                </div>
              </button>

              {isExpanded && (
                <div className="space-y-4 px-4 py-4">
                  <div className="grid gap-3 text-sm text-gray-700 sm:grid-cols-2 xl:grid-cols-4">
                    <ScopeInfo
                      label="Tipo de fornecimento"
                      value={scope.supplyType}
                    />
                    <ScopeInfo
                      label="Tipo de pavimento"
                      value={scope.scopeType}
                    />
                    <ScopeInfo
                      label="Arquivo de Projeto"
                      value={scope.projectFileName}
                    />
                    <ScopeInfo label="Delimitação" value={scope.boundary} />
                  </div>

                  <QuoteValuesTable<ScopeSummaryRow>
                    columns={scopeSummaryColumns}
                    rows={scopeSummaries[scope.id ?? -1] ?? []}
                    getRowType={row => row._rowType ?? 'body'}
                    emptyText={
                      loadingSummaries.has(scope.id ?? -1)
                        ? 'Carregando...'
                        : 'Nenhum elemento vinculado a este escopo.'
                    }
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <ScopeInfo
                      label="Gastalhos"
                      value={`${scope.gastalhoCount ?? 0} jogo(s)`}
                    />
                    <ScopeInfo
                      label="Fundo Adicional"
                      value={`${scope.fundoAdicionalCount ?? 0} jogo(s)`}
                    />
                    <ScopeInfo
                      label="Tira Adicional"
                      value={`${scope.tiraAdicionalCount ?? 0} jogo(s)`}
                    />
                    <ScopeInfo
                      label="Garfos em Bordas"
                      value={scope.garfoBordaEnabled ? 'Sim' : 'Não'}
                    />
                    <ScopeInfo
                      label="Garfos em Internas"
                      value={scope.garfoInternoEnabled ? 'Sim' : 'Não'}
                    />
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Observações
                    </p>
                    {scope.observations?.trim() ? (
                      <div
                        className="document-rich-content text-sm text-gray-800"
                        dangerouslySetInnerHTML={{ __html: scope.observations }}
                      />
                    ) : (
                      <p className="text-sm text-gray-800">-</p>
                    )}
                  </div>
                </div>
              )}
            </article>
          )
        }),
      [expandedScopeIds, scopes, scopeSummaries, loadingSummaries],
    )

    const isEditDisabled = Boolean(scopeActionTarget?.isLocked) || readOnly
    const editDisabledTooltip = readOnly
      ? 'Esta é uma versão somente leitura.'
      : scopeActionTarget?.isLockedByAnotherUser
      ? 'Este escopo está sendo editado por outro usuário.'
      : 'Este escopo está sendo editado por você em outra tela.'

    if (isLoading) {
      return (
        <div className="flex min-h-[240px] items-center justify-center rounded-lg bg-white shadow-sm">
          <CircularProgress sx={SPINNER_SX} />
        </div>
      )
    }

    return (
      <div className="space-y-4 rounded-lg bg-white p-4 shadow-sm">
        <GenericModal
          isOpen={isScopeLockWarningModalOpen}
          onClose={() => setIsScopeLockWarningModalOpen(false)}
          title="Não foi possível editar"
          onSave={() => setIsScopeLockWarningModalOpen(false)}
          saveButtonText="Entendi"
          showCancelButton={false}
          size="md"
        >
          <p className="text-sm text-gray-700">{scopeLockWarningMessage}</p>
        </GenericModal>

        <GenericModal
          isOpen={Boolean(scopeToDelete)}
          onClose={() => {
            if (!isDeleting) {
              setScopeToDelete(null)
            }
          }}
          title="Excluir escopo?"
          onSave={confirmDelete}
          saveButtonText="Excluir"
          isLoading={isDeleting}
          disableSave={isDeleting}
          size="md"
        >
          <p className="text-sm text-gray-700">
            {scopeToDelete
              ? `Tem certeza que deseja excluir o escopo “${scopeToDelete.name}”?`
              : 'Tem certeza que deseja excluir este escopo?'}
          </p>
        </GenericModal>

        <GenericModal
          isOpen={isCreateScopeModalOpen}
          onClose={() => {
            if (!isCreatingScope) {
              setIsCreateScopeModalOpen(false)
              setNewScopeName('')
            }
          }}
          title="Criar novo escopo"
          onSave={createNewScope}
          saveButtonText="Criar"
          isLoading={isCreatingScope}
          disableSave={isCreatingScope || !newScopeName.trim()}
          size="md"
        >
          <label className="text-sm text-gray-700">
            Nome do escopo
            <input
              type="text"
              value={newScopeName}
              onChange={e => setNewScopeName(e.target.value)}
              placeholder="Pavimento 1"
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              disabled={isCreatingScope}
            />
          </label>
        </GenericModal>

        <div className="flex items-center justify-end gap-4">
          <div className="h-5">
            {isRefreshing && (
              <p className="text-xs text-gray-500">Atualizando escopos...</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsCreateScopeModalOpen(true)}
            disabled={readOnly}
            className="inline-flex items-center gap-2 rounded bg-violet-500 px-3 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <FiPlus size={18} />
            Criar novo escopo
          </button>
        </div>

        <div className="space-y-3">
          {scopeCards.length > 0 ? (
            scopeCards
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
              Nenhum escopo encontrado para este orçamento.
            </div>
          )}
        </div>

        <Menu
          anchorEl={scopeActionAnchorEl}
          open={Boolean(scopeActionAnchorEl)}
          onClose={closeScopeActions}
        >
          <Tooltip
            title={isEditDisabled ? editDisabledTooltip : ''}
            placement="left"
            disableHoverListener={!isEditDisabled}
          >
            <span>
              <MenuItem
                onClick={requestEdit as () => void}
                disabled={isEditDisabled || isRefreshingScopeActionTarget}
              >
                <FiEdit2 size={16} className="mr-2" />
                Editar
                {isEditDisabled && (
                  <span className="ml-2 inline-flex items-center text-gray-500">
                    <FiLock size={12} />
                  </span>
                )}
              </MenuItem>
            </span>
          </Tooltip>
          {!readOnly && (
            <MenuItem onClick={requestDeleteFromMenu} className="text-red-600">
              <FiTrash2 size={16} className="mr-2" />
              Excluir
            </MenuItem>
          )}
        </Menu>
      </div>
    )
  },
)

ScopesTab.displayName = 'ScopesTab'

export default ScopesTab
