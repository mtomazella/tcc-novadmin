import React, { useCallback, useEffect, useRef, useState } from 'react'
import { CircularProgress } from '@mui/material'
import { FiArrowLeft } from 'react-icons/fi'
import {
  useBlocker,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { toast } from 'react-toastify'
import ElementsTab, { type TabLeaveGuardHandle } from './ElementsTab'
import { getQuoteById } from 'services/api/quoteService'
import PreviewTab from './PreviewTab'
import ScopesTab from './ScopesTab'
import ValuesTab from './ValuesTab'
import type { QuoteApiItem } from 'types/quote'
import GenericModal from 'components/GenericModal'

const SPINNER_SX = { color: '#7C3AED' }

type TabKey = 'elements' | 'scopes' | 'values' | 'preview'

const tabLabels: Record<TabKey, string> = {
  scopes: 'Escopo',
  elements: 'Elementos',
  values: 'Valores',
  preview: 'Preview',
}

const tabs = Object.entries(tabLabels).map(([key, label]) => ({
  key: key as TabKey,
  label,
}))

const isTabKey = (value: string | null): value is TabKey =>
  value === 'scopes' ||
  value === 'elements' ||
  value === 'values' ||
  value === 'preview'

const QuoteManagerPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const quoteId = Number(id)
  const tabFromQuery = searchParams.get('tab')

  const [quote, setQuote] = useState<QuoteApiItem | null>(null)
  const [elementsLockState, setElementsLockState] = useState({
    isElementsLocked: false,
    isElementsLockedByAnotherUser: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>(
    isTabKey(tabFromQuery) ? tabFromQuery : 'scopes',
  )
  const [tabReloadToken, setTabReloadToken] = useState(0)
  const [isActiveTabDirty, setIsActiveTabDirty] = useState(false)
  const [pendingTabKey, setPendingTabKey] = useState<TabKey | null>(null)
  const [isLeaveGuardModalOpen, setIsLeaveGuardModalOpen] = useState(false)
  const [isResolvingLeaveAction, setIsResolvingLeaveAction] = useState(false)

  const activeTabLeaveGuardRef = useRef<TabLeaveGuardHandle | null>(null)
  const allowBlockedNavigationRef = useRef(false)

  const loadQuote = async () => {
    if (!Number.isFinite(quoteId)) {
      toast.error('ID de orçamento inválido')
      navigate('/orcamento')
      return
    }

    setIsLoading(true)

    try {
      const quoteResponse = await getQuoteById(quoteId)

      const currentQuote = quoteResponse.data?.[0] ?? null

      if (!currentQuote) {
        toast.error('Orçamento não encontrado')
        navigate('/orcamento')
        return
      }

      setQuote(currentQuote)
      setElementsLockState({
        isElementsLocked: Boolean(currentQuote.isElementsLocked),
        isElementsLockedByAnotherUser: Boolean(
          currentQuote.isElementsLockedByAnotherUser,
        ),
      })
    } catch (error) {
      const errorMessage =
        (error as Error)?.message || 'Erro ao carregar dados do orçamento'
      toast.error(errorMessage)
      navigate('/orcamento')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadQuote()
  }, [navigate, quoteId])

  const refreshElementsLockState = async () => {
    if (!Number.isFinite(quoteId)) {
      return
    }

    try {
      const quoteResponse = await getQuoteById(quoteId)
      const currentQuote = quoteResponse.data?.[0] ?? null

      setElementsLockState({
        isElementsLocked: Boolean(currentQuote?.isElementsLocked),
        isElementsLockedByAnotherUser: Boolean(
          currentQuote?.isElementsLockedByAnotherUser,
        ),
      })
    } catch (error) {
      const errorMessage =
        (error as Error)?.message || 'Erro ao atualizar status de bloqueio'
      toast.error(errorMessage)
    }
  }

  useEffect(() => {
    if (tabReloadToken === 0) {
      return
    }

    void refreshElementsLockState()
  }, [tabReloadToken])

  useEffect(() => {
    if (!isTabKey(tabFromQuery)) {
      return
    }

    setActiveTab(current => (current === tabFromQuery ? current : tabFromQuery))
  }, [tabFromQuery])

  const activateTab = (nextTab: TabKey) => {
    setActiveTab(nextTab)
    setTabReloadToken(previous => previous + 1)
  }

  const renderActiveTab = () => {
    if (activeTab === 'elements') {
      return (
        <ElementsTab
          ref={activeTabLeaveGuardRef}
          quoteId={quoteId}
          isElementsLocked={elementsLockState.isElementsLocked}
          isElementsLockedByAnotherUser={
            elementsLockState.isElementsLockedByAnotherUser
          }
          onDirtyStateChange={setIsActiveTabDirty}
          readOnly={readOnly}
        />
      )
    }

    if (activeTab === 'scopes') {
      return (
        <ScopesTab
          ref={activeTabLeaveGuardRef}
          quoteId={quoteId}
          reloadToken={tabReloadToken}
          readOnly={readOnly}
        />
      )
    }

    if (activeTab === 'values') {
      return (
        <ValuesTab
          ref={activeTabLeaveGuardRef}
          quoteId={quoteId}
          onDirtyStateChange={setIsActiveTabDirty}
          readOnly={readOnly}
        />
      )
    }

    return (
      <PreviewTab
        ref={activeTabLeaveGuardRef}
        quoteId={quoteId}
        onDirtyStateChange={setIsActiveTabDirty}
        readOnly={readOnly}
      />
    )
  }

  const navigationBlocker = useBlocker(
    useCallback(
      () =>
        isActiveTabDirty &&
        !!activeTabLeaveGuardRef.current?.isDirty() &&
        !allowBlockedNavigationRef.current,
      [isActiveTabDirty],
    ),
  )

  useEffect(() => {
    if (navigationBlocker.state === 'blocked') {
      setIsLeaveGuardModalOpen(true)
    }
  }, [navigationBlocker.state])

  const requestTabChange = (nextTab: TabKey) => {
    if (nextTab === activeTab) {
      return
    }

    if (isActiveTabDirty && activeTabLeaveGuardRef.current?.isDirty()) {
      setPendingTabKey(nextTab)
      setIsLeaveGuardModalOpen(true)
      return
    }

    activateTab(nextTab)
  }

  const stayOnCurrentTab = () => {
    setPendingTabKey(null)
    setIsLeaveGuardModalOpen(false)
    if (navigationBlocker.state === 'blocked') {
      navigationBlocker.reset()
    }
  }

  const leaveWithoutSaving = async () => {
    setIsResolvingLeaveAction(true)
    try {
      const discarded =
        await activeTabLeaveGuardRef.current?.discardBeforeLeave()
      if (!discarded) return
      setIsLeaveGuardModalOpen(false)
      if (pendingTabKey) {
        activateTab(pendingTabKey)
        setPendingTabKey(null)
      } else if (navigationBlocker.state === 'blocked') {
        allowBlockedNavigationRef.current = true
        navigationBlocker.proceed()
      }
    } finally {
      setIsResolvingLeaveAction(false)
    }
  }

  const saveAndLeave = async () => {
    setIsResolvingLeaveAction(true)
    try {
      const saved = await activeTabLeaveGuardRef.current?.saveBeforeLeave()
      if (!saved) return
      setIsLeaveGuardModalOpen(false)
      if (pendingTabKey) {
        activateTab(pendingTabKey)
        setPendingTabKey(null)
      } else if (navigationBlocker.state === 'blocked') {
        allowBlockedNavigationRef.current = true
        navigationBlocker.proceed()
      }
    } finally {
      setIsResolvingLeaveAction(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <div className="flex min-h-screen items-center justify-center">
          <CircularProgress sx={SPINNER_SX} />
        </div>
      </div>
    )
  }

  if (!quote) {
    return null
  }

  const readOnly = quote.isLeaf === false

  return (
    <div
      className={
        activeTab === 'preview'
          ? 'flex h-screen flex-col overflow-hidden bg-[#f5f5f5]'
          : 'min-h-screen bg-[#f5f5f5]'
      }
    >
      <GenericModal
        isOpen={isLeaveGuardModalOpen}
        onClose={stayOnCurrentTab}
        title="Sair sem salvar?"
        showCancelButton={false}
        size="md"
      >
        <p className="text-sm text-gray-700">
          Existem alterações em andamento nesta aba. Escolha como deseja sair.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={stayOnCurrentTab}
            disabled={isResolvingLeaveAction}
            className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Ficar
          </button>
          <button
            type="button"
            onClick={leaveWithoutSaving}
            disabled={isResolvingLeaveAction}
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Não salvar e sair
          </button>
          <button
            type="button"
            onClick={saveAndLeave}
            disabled={isResolvingLeaveAction}
            className="rounded bg-violet-500 px-3 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Salvar e sair
          </button>
        </div>
      </GenericModal>

      <div className="shrink-0 border-b border-[#333333] bg-[#1a1a1a] text-white shadow-sm">
        <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-lg font-semibold tracking-wide md:text-xl">
                {quote.formattedQuoteNumber}
              </h1>
              {readOnly && (
                <span className="rounded border border-gray-400 px-2 py-0.5 text-xs font-semibold text-gray-300">
                  Somente leitura
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-300">
              {quote.client?.name || '-'} - {quote.obra?.name || '-'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/orcamento')}
              className="inline-flex items-center gap-2 rounded border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              <FiArrowLeft />
              Voltar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 border-t border-white/10 bg-[#2d2d2d]">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => requestTabChange(tab.key)}
                className={`w-full px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-violet-500 text-white'
                    : 'text-gray-200 hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'preview' ? (
        <div className="min-w-0 flex-1 overflow-hidden">
          {renderActiveTab()}
        </div>
      ) : (
        <main className="w-full px-4 py-4">{renderActiveTab()}</main>
      )}
    </div>
  )
}

export default QuoteManagerPage
