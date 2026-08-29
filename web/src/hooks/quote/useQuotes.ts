import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import type { Client } from '../../types/client'
import type {
  QuoteCreateBody,
  QuoteListRow,
  QuoteParams,
} from '../../types/quote'
import type { Work } from '../../types/work'
import {
  createQuote,
  createQuoteAddition,
  createQuoteRevision,
  deleteQuote,
  getQuotes,
} from '../../services/api/quoteService'
import { getClients } from '../../services/api/clientService'
import { getWorks } from '../../services/api/workService'

const getQuoteStatus = (quote: { versionType?: string | null }) => {
  if (quote.versionType === 'revision') return 'Revisão'
  if (quote.versionType === 'addition') return 'Adição'
  return 'Original'
}

const getCurrentTwoDigitYear = () =>
  Number(new Date().getFullYear().toString().slice(-2))

export default function useQuotes() {
  const navigate = useNavigate()
  const tableRef = useRef<{ refresh: () => void }>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [quoteToDelete, setQuoteToDelete] = useState<QuoteListRow | null>(null)
  const [versionActionTarget, setVersionActionTarget] =
    useState<QuoteListRow | null>(null)
  const [versionActionType, setVersionActionType] = useState<
    'revision' | 'addition' | null
  >(null)
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false)
  const [isCreatingVersion, setIsCreatingVersion] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [works, setWorks] = useState<Work[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedWorkId, setSelectedWorkId] = useState('')
  const [quoteNumber, setQuoteNumber] = useState('')
  const [revisionNumber, setRevisionNumber] = useState('')
  const [additionNumber, setAdditionNumber] = useState('')
  const [yearCode, setYearCode] = useState(String(getCurrentTwoDigitYear()))

  const canSubmitCreate = useMemo(
    () => Boolean(selectedClientId && selectedWorkId),
    [selectedClientId, selectedWorkId],
  )

  const filteredWorks = useMemo(() => {
    if (!selectedClientId) {
      return works
    }

    return works.filter(work => work.clientId?.toString() === selectedClientId)
  }, [selectedClientId, works])

  const loadCreateOptions = useCallback(async () => {
    try {
      const [clientsResponse, worksResponse] = await Promise.all([
        getClients({ page: 1, limit: 500, order: 'name' }),
        getWorks({ page: 1, limit: 500, order: 'name' }),
      ])

      setClients(clientsResponse.data || [])
      setWorks(worksResponse.data || [])
    } catch (error) {
      const errorMessage =
        (error as Error)?.message || 'Erro ao carregar clientes e obras'
      toast.error(errorMessage)
    }
  }, [])

  useEffect(() => {
    if (!isCreateModalOpen) {
      return
    }

    loadCreateOptions()
  }, [isCreateModalOpen, loadCreateOptions])

  useEffect(() => {
    if (!selectedClientId || !selectedWorkId) {
      return
    }

    const selectedWork = works.find(
      work => work.id.toString() === selectedWorkId,
    )

    if (
      selectedWork &&
      selectedWork.clientId !== undefined &&
      selectedWork.clientId.toString() !== selectedClientId
    ) {
      setSelectedWorkId('')
    }
  }, [selectedClientId, selectedWorkId, works])

  const fetchQuotes = useCallback(
    async (params: { page: number; limit: number }) => {
      try {
        const apiParams: QuoteParams = {
          page: params.page,
          limit: params.limit,
          includeClient: true,
          includeObra: true,
          includeVersionSummary: true,
          order: 'updatedAt_desc',
          rootStatus: 'onlyLeaves',
          generalFuzzyValue: searchTerm.trim() ? searchTerm.trim() : undefined,
        }

        const response = await getQuotes(apiParams)

        const rows: QuoteListRow[] = response.data.map(quote => ({
          ...quote,
          clientName: quote.client?.name || '-',
          workName: quote.obra?.name || '-',
          createdAt: quote.createdAt
            ? new Date(quote.createdAt as unknown as string).toLocaleDateString(
                'pt-BR',
              )
            : '-',
          status: getQuoteStatus(quote),
        }))

        return {
          count: response.count,
          data: rows,
          meta: {
            page: params.page,
            limit: params.limit,
          },
        }
      } catch (error) {
        const errorMessage =
          (error as Error)?.message || 'Erro ao carregar quotes'
        toast.error(errorMessage)
        return {
          count: { total: 0, page: params.page },
          data: [],
          meta: {
            page: params.page,
            limit: params.limit,
          },
        }
      }
    },
    [searchTerm],
  )

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    tableRef.current?.refresh()
  }

  const handleAdd = () => {
    setSelectedClientId('')
    setSelectedWorkId('')
    setQuoteNumber('')
    setRevisionNumber('')
    setAdditionNumber('')
    setYearCode(String(getCurrentTwoDigitYear()))
    setIsCreateModalOpen(true)
  }

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId)
    setSelectedWorkId('')
  }

  const handleSelectWork = (workId: string) => {
    setSelectedWorkId(workId)

    const selectedWork = works.find(work => work.id.toString() === workId)

    if (selectedWork?.clientId !== undefined) {
      setSelectedClientId(selectedWork.clientId.toString())
    }
  }

  const handleEdit = (quote: QuoteListRow) => {
    if (!quote.id) {
      toast.error('Orçamento inválido para edição.')
      return
    }

    navigate(`/orcamento/edit/${quote.id}`)
  }

  const handleDelete = async (quote: QuoteListRow) => {
    if (!quote.id) {
      toast.error('Orçamento inválido para exclusão.')
      return
    }

    setQuoteToDelete(quote)
    setIsDeleteModalOpen(true)
  }

  const handleCreateRevision = (quote: QuoteListRow) => {
    if (!quote.id) {
      toast.error('Orçamento inválido.')
      return
    }

    setVersionActionTarget(quote)
    setVersionActionType('revision')
    setIsVersionModalOpen(true)
  }

  const handleCreateAddition = (quote: QuoteListRow) => {
    if (!quote.id) {
      toast.error('Orçamento inválido.')
      return
    }

    setVersionActionTarget(quote)
    setVersionActionType('addition')
    setIsVersionModalOpen(true)
  }

  const handleConfirmCreateVersion = async () => {
    if (!versionActionTarget?.id || !versionActionType) {
      toast.error('Orçamento inválido.')
      return
    }

    try {
      setIsCreatingVersion(true)

      const created =
        versionActionType === 'revision'
          ? await createQuoteRevision(versionActionTarget.id)
          : await createQuoteAddition(versionActionTarget.id)

      const newQuoteId = created[0]?.id

      toast.success(
        versionActionType === 'revision'
          ? 'Revisão criada com sucesso!'
          : 'Adição criada com sucesso!',
      )
      setIsVersionModalOpen(false)
      setVersionActionTarget(null)
      setVersionActionType(null)
      tableRef.current?.refresh()

      if (newQuoteId) {
        navigate(`/orcamento/edit/${newQuoteId}`)
      }
    } catch (error) {
      const errorMessage =
        (error as Error)?.message || 'Erro ao criar nova versão'
      toast.error(errorMessage)
    } finally {
      setIsCreatingVersion(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!quoteToDelete?.id) {
      toast.error('Orçamento inválido para exclusão.')
      return
    }

    try {
      setIsDeleting(true)
      await deleteQuote(quoteToDelete.id)
      toast.success('Orçamento excluído com sucesso!')
      setIsDeleteModalOpen(false)
      setQuoteToDelete(null)
      tableRef.current?.refresh()
    } catch (error) {
      const errorMessage =
        (error as Error)?.message || 'Erro ao excluir orçamento'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCreateQuote = async () => {
    if (!selectedClientId || !selectedWorkId) {
      toast.error('Selecione um cliente e uma obra.')
      return
    }

    try {
      setIsCreating(true)

      const payload: QuoteCreateBody = {
        clientId: Number(selectedClientId),
        obraId: Number(selectedWorkId),
        quoteNumber: quoteNumber.trim() || undefined,
        revisionNumber:
          revisionNumber === '' ? undefined : Number(revisionNumber),
        additionNumber:
          additionNumber === '' ? undefined : Number(additionNumber),
        yearCode: yearCode === '' ? undefined : Number(yearCode),
      }

      await createQuote(payload)
      toast.success('Orçamento criado com sucesso!')
      setIsCreateModalOpen(false)
      setSelectedClientId('')
      setSelectedWorkId('')
      setQuoteNumber('')
      setRevisionNumber('')
      setAdditionNumber('')
      setYearCode(String(getCurrentTwoDigitYear()))
      tableRef.current?.refresh()
    } catch (error) {
      const errorMessage =
        (error as Error)?.message || 'Erro ao criar orçamento'
      toast.error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  return {
    navigate,
    searchTerm,
    setSearchTerm,
    tableRef,
    fetchQuotes,
    handleSearch,
    handleAdd,
    handleEdit,
    handleDelete,
    handleCreateQuote,
    clients,
    works,
    filteredWorks,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isCreating,
    selectedClientId,
    setSelectedClientId: handleSelectClient,
    selectedWorkId,
    setSelectedWorkId: handleSelectWork,
    quoteNumber,
    setQuoteNumber,
    revisionNumber,
    setRevisionNumber,
    additionNumber,
    setAdditionNumber,
    yearCode,
    setYearCode,
    canSubmitCreate,
    quoteToDelete,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleting,
    handleConfirmDelete,
    handleCreateRevision,
    handleCreateAddition,
    handleConfirmCreateVersion,
    versionActionTarget,
    versionActionType,
    isVersionModalOpen,
    setIsVersionModalOpen,
    isCreatingVersion,
  }
}
