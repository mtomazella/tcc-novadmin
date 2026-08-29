import React from 'react'
import GenericTable from '../../components/GenericTable'
import ExcludeClient from './ExcludeClient'
import EditClient from './EditClient'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useClientsPage } from '../../hooks/client/useClientsPage'
import Header from '../../components/Header'
import {
  useHasPermission,
  webPermissions,
} from '../../hooks/auth/usePermissions'

const ClientsPage: React.FC = () => {
  const {
    isModalOpen,
    setIsModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    searchTerm,
    setSearchTerm,
    currentClient,
    setCurrentClient,
    apiError,
    isMutating,
    tableRef,
    newClient,
    setNewClient,
    fetchClients,
    handleAddClient,
    handleEdit,
    handleDelete,
    confirmDelete,
    isSaveDisabled,
  } = useClientsPage()

  const canView = useHasPermission(webPermissions.client.view)
  const canAdd = useHasPermission(webPermissions.client.add)
  const canEdit = useHasPermission(webPermissions.client.edit)
  const canDelete = useHasPermission(webPermissions.client.delete)

  if (!canView) {
    return (
      <div className="ml-0 p-4 min-h-screen bg-gray-50">
        <Header Title="Clientes" />
        <div className="max-w-[90vw] mx-auto px-2 py-4 sm:px-4 ">
          <div className="px-2 py-4 sm:px-0">
            <div className="rounded-lg p-6 bg-white shadow text-center">
              <p className="text-red-500 text-lg">
                Você não tem permissão para visualizar clientes.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ml-0 p-4 min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      <Header Title="Clientes" />

      <main>
        <div className="px-2 py-4 sm:px-0">
          <div className="rounded-lg p-3 md:p-6 bg-white shadow">
            {apiError && (
              <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                <p>{apiError}</p>
              </div>
            )}

            <div className="mb-4 md:mb-6">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Pesquisar
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  className="w-full p-2 pl-8 border rounded focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                  placeholder="Digite para filtrar..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
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

            <GenericTable
              ref={tableRef}
              columns={[
                { id: 'name', label: 'Nome', field: 'name' },
                {
                  id: 'phone',
                  label: 'Telefone',
                  field: 'phone',
                  hideOnMobile: true,
                },
                {
                  id: 'city',
                  label: 'Cidade',
                  field: 'city',
                  hideOnMobile: true,
                },
                {
                  id: 'state',
                  label: 'Estado',
                  field: 'state',
                  hideOnMobile: true,
                },
                {
                  id: 'address',
                  label: 'Endereço',
                  field: 'address',
                  truncate: true,
                  hideOnMobile: true,
                },
              ]}
              fetchData={fetchClients}
              onAddClick={
                canAdd
                  ? () => {
                      setCurrentClient(null)
                      setNewClient({
                        name: '',
                        phone: '',
                        city: '',
                        state: '',
                        address: '',
                        zipCode: '',
                      })
                      setIsModalOpen(true)
                    }
                  : undefined
              }
              addButtonText="Adicionar Cliente"
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={canDelete ? handleDelete : undefined}
              data={[]}
            />
          </div>
        </div>
      </main>

      {canAdd || canEdit ? (
        <EditClient
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          setNewClient={setNewClient}
          newClient={newClient}
          setCurrentClient={setCurrentClient}
          handleAddClient={handleAddClient}
          currentClient={currentClient}
          isLoading={isMutating}
          disableSave={isSaveDisabled}
        />
      ) : null}

      {canDelete ? (
        <ExcludeClient
          isDeleteModalOpen={isDeleteModalOpen}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
          setCurrentClient={setCurrentClient}
          confirmDelete={confirmDelete}
          currentClient={currentClient}
          isLoading={isMutating}
        />
      ) : null}
    </div>
  )
}

export default ClientsPage
