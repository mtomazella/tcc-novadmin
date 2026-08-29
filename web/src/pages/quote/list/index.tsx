import React from 'react'
import GenericModal from 'components/GenericModal'
import GenericTable from 'components/GenericTable'
import Header from 'components/Header'
import { useHasPermission } from 'hooks/auth/usePermissions'
import useQuotes from 'hooks/quote/useQuotes'

const QuoteListPage: React.FC = () => {
  const {
    searchTerm,
    setSearchTerm,
    tableRef,
    fetchQuotes,
    handleSearch,
    handleAdd,
    handleEdit,
    handleDelete,
    handleConfirmDelete,
    handleCreateRevision,
    handleCreateAddition,
    handleConfirmCreateVersion,
    versionActionTarget,
    versionActionType,
    isVersionModalOpen,
    setIsVersionModalOpen,
    isCreatingVersion,
    handleCreateQuote,
    clients,
    filteredWorks,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isCreating,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleting,
    quoteToDelete,
    selectedClientId,
    setSelectedClientId,
    selectedWorkId,
    setSelectedWorkId,
    quoteNumber,
    setQuoteNumber,
    revisionNumber,
    setRevisionNumber,
    additionNumber,
    setAdditionNumber,
    yearCode,
    setYearCode,
    canSubmitCreate,
  } = useQuotes()

  const canView = useHasPermission('web:quote:view')
  const canAdd = useHasPermission('web:quote:add')
  const canEdit = useHasPermission('web:quote:edit')
  const canDelete = useHasPermission('web:quote:delete')

  const columns = [
    { id: 'quoteNumber', label: 'Numero', field: 'formattedQuoteNumber' },
    { id: 'clientName', label: 'Cliente', field: 'clientName' },
    { id: 'workName', label: 'Obra', field: 'workName' },
    {
      id: 'createdAt',
      label: 'Criado em',
      field: 'createdAt',
      formatter: (value: string) => {
        if (!value) return '-'
        // Top-level rows arrive pre-formatted (pt-BR, no "T"); versionSummary
        // child rows carry the raw ISO timestamp from the API.
        if (!value.includes('T')) return value
        return new Date(value).toLocaleDateString('pt-BR')
      },
    },
    {
      id: 'status',
      label: 'Status',
      field: 'status',
      formatter: (value: string, item: any) => {
        if (value) return value
        if (item.versionType === 'revision') return 'Revisão'
        if (item.versionType === 'addition') return 'Adição'
        return 'Original'
      },
    },
  ]

  if (!canView) {
    return (
      <div className="ml-0 p-4 min-h-screen bg-gray-50">
        <Header Title="Orçamentos" />
        <main className="max-w-[90vw] mx-auto px-2 py-4 sm:px-4">
          <div className="px-2 py-4 sm:px-0">
            <div className="rounded-lg p-6 bg-white shadow text-center">
              <p className="text-red-500 text-lg">
                Voce nao tem permissão para visualizar orçamentos.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="ml-0 p-4 min-h-screen bg-gray-50">
      <Header Title="Orçamentos" />

      <main>
        <div className="px-2 py-4 sm:px-0">
          <div className="rounded-lg p-3 md:p-6 bg-white shadow">
            <form onSubmit={handleSearch} className="mb-4 md:mb-6">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Pesquisar
              </label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    id="search"
                    className="w-full p-2 pl-8 border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                    placeholder="Digite para filtrar..."
                    value={searchTerm}
                    onChange={event => setSearchTerm(event.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </form>

            <GenericTable
              ref={tableRef}
              columns={columns}
              fetchData={fetchQuotes}
              onAddClick={canAdd ? handleAdd : undefined}
              addButtonText="Novo Orçamento"
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={canDelete ? handleDelete : undefined}
              onCreateRevision={canEdit ? handleCreateRevision : undefined}
              onCreateAddition={canEdit ? handleCreateAddition : undefined}
              onRowDoubleClick={canEdit ? handleEdit : undefined}
              expandable
              rowIdField="id"
              getRowChildren={(row: any) =>
                row.versionSummary?.filter((v: any) => v.id !== row.id)
              }
            />
          </div>
        </div>
      </main>

      <GenericModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Novo Orçamento"
        onSave={handleCreateQuote}
        saveButtonText="Criar"
        isLoading={isCreating}
        disableSave={!canSubmitCreate}
        size="md"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <select
              className="w-full p-2 border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent bg-white"
              value={selectedClientId}
              onChange={event => setSelectedClientId(event.target.value)}
            >
              <option value="">Selecione o cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Obra
            </label>
            <select
              className="w-full p-2 border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent bg-white"
              value={selectedWorkId}
              onChange={event => setSelectedWorkId(event.target.value)}
              disabled={!selectedClientId}
            >
              <option value="">Selecione a obra</option>
              {filteredWorks.map(work => (
                <option key={work.id} value={work.id}>
                  {work.name.toUpperCase()}
                </option>
              ))}
            </select>
            {selectedClientId && filteredWorks.length === 0 ? (
              <p className="mt-2 text-sm text-amber-700">
                Não há obras para este cliente.
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número do orçamento
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              value={quoteNumber}
              onChange={event => setQuoteNumber(event.target.value)}
              placeholder="Gerado automaticamente"
            />
            <p className="mt-1 text-xs text-gray-500">
              Deixe em branco para gerar automaticamente.
            </p>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Revisão
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                  value={revisionNumber}
                  onChange={event => setRevisionNumber(event.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adição
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                  value={additionNumber}
                  onChange={event => setAdditionNumber(event.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ano
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                  value={yearCode}
                  onChange={event => setYearCode(event.target.value)}
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Deixe revisão e adição em branco para gerar automaticamente.
            </p>
          </div>
        </div>
      </GenericModal>

      <GenericModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar exclusão"
        onSave={handleConfirmDelete}
        saveButtonText="Excluir"
        isLoading={isDeleting}
        showCancelButton={true}
        size="sm"
      >
        <p className="text-sm text-gray-700">
          Tem certeza que deseja excluir o orçamento{' '}
          <strong>{quoteToDelete?.quoteNumber || ''}</strong>?
        </p>
      </GenericModal>

      <GenericModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        title={
          versionActionType === 'revision' ? 'Nova revisão' : 'Nova adição'
        }
        onSave={handleConfirmCreateVersion}
        saveButtonText="Criar"
        isLoading={isCreatingVersion}
        showCancelButton={true}
        size="sm"
      >
        <p className="text-sm text-gray-700">
          {versionActionType === 'revision' ? (
            <>
              Criar uma nova revisão do orçamento{' '}
              <strong>{versionActionTarget?.formattedQuoteNumber}</strong>?
              Todos os escopos e elementos serão copiados.
            </>
          ) : (
            <>
              Criar uma nova adição do orçamento{' '}
              <strong>{versionActionTarget?.formattedQuoteNumber}</strong>? A
              adição começará sem escopos ou elementos.
            </>
          )}
        </p>
      </GenericModal>
    </div>
  )
}

export default QuoteListPage
