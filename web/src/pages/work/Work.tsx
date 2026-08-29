import React, { useRef } from 'react'
import GenericTable from '../../components/GenericTable'
import ExcludeWork from './ExcludeWork'
import EditWork from './EditWork'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import useWorks from '../../hooks/work/useWorks'
import Header from '../../components/Header'
import {
  useHasPermission,
  webPermissions,
} from '../../hooks/auth/usePermissions'

const WorksPage: React.FC = () => {
  const tableRef = useRef<{ refresh: () => void }>(null)
  const {
    states: {
      isModalOpen,
      isDeleteModalOpen,
      searchTerm,
      currentWork,
      apiError,
      isMutating,
      clients,
      newWork,
      isSaveDisabled,
    },
    actions: {
      setIsModalOpen,
      setIsDeleteModalOpen,
      setSearchTerm,
      setCurrentWork,
      setNewWork,
      fetchWorks,
      handleAddWork,
      handleEdit,
      handleDelete,
      confirmDelete,
    },
  } = useWorks()

  const canView = useHasPermission(webPermissions.obra.view)
  const canAdd = useHasPermission(webPermissions.obra.add)
  const canEdit = useHasPermission(webPermissions.obra.edit)
  const canDelete = useHasPermission(webPermissions.obra.delete)

  const enhancedHandleAddWork = async () => {
    const success = await handleAddWork()
    if (success && tableRef.current) {
      tableRef.current.refresh()
    }
  }

  const enhancedConfirmDelete = async () => {
    const success = await confirmDelete()
    if (success && tableRef.current) {
      tableRef.current.refresh()
    }
  }

  if (!canView) {
    return (
      <div className="ml-0 p-4 min-h-screen bg-gray-50">
        <Header Title="Obras" />
        <main className="max-w-[90vw] mx-auto px-2 py-4 sm:px-4 ">
          <div className="px-2 py-4 sm:px-0">
            <div className="rounded-lg p-6 bg-white shadow text-center">
              <p className="text-red-500 text-lg">
                Você não tem permissão para visualizar obras.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="ml-0 p-4 min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />

      <Header Title="Obras" />

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
                  id: 'client',
                  label: 'Cliente',
                  field: 'client.name',
                  hideOnMobile: true,
                },
                {
                  id: 'contact',
                  label: 'Responsável',
                  field: 'contact',
                  hideOnMobile: true,
                },
              ]}
              fetchData={fetchWorks}
              onAddClick={
                canAdd
                  ? () => {
                      setCurrentWork(null)
                      setNewWork({
                        name: '',
                        description: '',
                        phone: '',
                        email: '',
                        address: '',
                        addressComplement: '',
                        contact: '',
                        clientId: undefined,
                      })
                      setIsModalOpen(true)
                    }
                  : undefined
              }
              addButtonText="Adicionar Obra"
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={canDelete ? handleDelete : undefined}
              data={[]}
            />
          </div>
        </div>
      </main>

      {(canAdd || canEdit) && (
        <EditWork
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          setNewWork={setNewWork}
          newWork={newWork}
          setCurrentWork={setCurrentWork}
          handleAddWork={enhancedHandleAddWork}
          currentWork={currentWork}
          clients={clients}
          isLoading={isMutating}
          disableSave={isSaveDisabled}
        />
      )}

      {canDelete && (
        <ExcludeWork
          isDeleteModalOpen={isDeleteModalOpen}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
          setCurrentWork={setCurrentWork}
          confirmDelete={enhancedConfirmDelete}
          currentWork={currentWork}
          isLoading={isMutating}
        />
      )}
    </div>
  )
}

export default WorksPage
