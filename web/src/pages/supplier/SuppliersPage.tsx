import React from 'react'
import GenericTable from 'components/GenericTable'
import ExcludeSupplier from './ExcludeSupplier'
import EditSupplier from './EditSupplier'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSuppliersPage } from 'hooks/supplier/useSuppliersPage'
import Header from 'components/Header'
import { useHasPermission, webPermissions } from 'hooks/auth/usePermissions'

const SuppliersPage: React.FC = () => {
  const {
    tableRef,
    searchTerm,
    setSearchTerm,
    apiError,
    isModalOpen,
    setIsModalOpen,
    editingSupplierId,
    initialName,
    initialMaterials,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    supplierToDelete,
    setSupplierToDelete,
    isMutating,
    fetchSuppliers,
    openCreate,
    openEdit,
    saveSupplier,
    openDelete,
    confirmDelete,
    canEdit,
    canDelete,
  } = useSuppliersPage()

  const canView = useHasPermission(webPermissions.supplier.view)

  if (!canView) {
    return (
      <div className="ml-0 p-4 min-h-screen bg-gray-50">
        <Header Title="Fornecedores" />
        <div className="max-w-[90vw] mx-auto px-2 py-4 sm:px-4">
          <div className="px-2 py-4 sm:px-0">
            <div className="rounded-lg p-6 bg-white shadow text-center">
              <p className="text-red-500 text-lg">
                Você não tem permissão para visualizar fornecedores.
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
      <Header Title="Fornecedores" />

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
                  id: 'materialCount',
                  label: 'Quantidade de Materiais',
                  field: 'materialCount',
                  hideOnMobile: true,
                },
              ]}
              fetchData={fetchSuppliers}
              onAddClick={canEdit ? openCreate : undefined}
              addButtonText="Adicionar Fornecedor"
              onEdit={canEdit ? openEdit : undefined}
              onDelete={canDelete ? openDelete : undefined}
            />
          </div>
        </div>
      </main>

      {canEdit && (
        <EditSupplier
          isModalOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialName={initialName}
          initialMaterials={initialMaterials}
          onSave={saveSupplier}
          isLoading={isMutating}
          isEditing={editingSupplierId !== undefined}
        />
      )}

      {canDelete && (
        <ExcludeSupplier
          isDeleteModalOpen={isDeleteModalOpen}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
          setCurrentSupplier={setSupplierToDelete}
          confirmDelete={confirmDelete}
          currentSupplier={supplierToDelete}
          isLoading={isMutating}
        />
      )}
    </div>
  )
}

export default SuppliersPage
