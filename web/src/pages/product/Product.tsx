import React, { useRef } from 'react'
import { decimalToPercent } from '@novadmin/lib/utils/unitConversion'
import GenericTable from 'components/GenericTable'
import ExcludeProduct from './ExcludeProduct'
import EditProduct from './EditProduct'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import useProducts from 'hooks/product/useProducts'
import Header from 'components/Header'
import { useHasPermission, webPermissions } from 'hooks/auth/usePermissions'

const ProductsPage: React.FC = () => {
  const tableRef = useRef<{ refresh: () => void }>(null)
  const {
    states: {
      isModalOpen,
      isDeleteModalOpen,
      searchTerm,
      currentProduct,
      apiError,
      isMutating,
      newProduct,
    },
    actions: {
      setIsModalOpen,
      setIsDeleteModalOpen,
      setSearchTerm,
      setCurrentProduct,
      setNewProduct,
      fetchProducts,
      handleAddProduct,
      handleEdit,
      handleDelete,
      confirmDelete,
    },
  } = useProducts()

  const canView = useHasPermission(webPermissions.product.view)
  const canAdd = useHasPermission(webPermissions.product.add)
  const canEdit = useHasPermission(webPermissions.product.edit)
  const canDelete = useHasPermission(webPermissions.product.delete)

  const enhancedHandleAddProduct = async () => {
    const success = await handleAddProduct()
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
      <div className="p-4 min-h-screen bg-gray-50">
        <Header Title="Produtos" />
        <main className="max-w-[90vw] mx-auto px-2 py-4 sm:px-4 ">
          <div className="px-2 py-4 sm:px-0">
            <div className="rounded-lg p-6 bg-white shadow text-center">
              <p className="text-red-500 text-lg">
                Você não tem permissão para visualizar produtos.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />

      <Header Title="Produtos" />

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
                Filtrar por Nome ou Sigla
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
                { id: 'shorthand', label: 'Sigla', field: 'shorthand' },
                {
                  id: 'description',
                  label: 'Descrição',
                  field: 'description',
                  truncate: true,
                  hideOnMobile: true,
                },
                {
                  id: 'commercialPercentage',
                  label: '% Comercial',
                  field: 'commercialPercentage',
                  hideOnMobile: true,
                  formatter: (v: number | null | '') =>
                    v == null || v === ''
                      ? '-'
                      : `${decimalToPercent(v).toLocaleString('pt-BR', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}%`,
                },
                {
                  id: 'projectPercentage',
                  label: '% Projeto',
                  field: 'projectPercentage',
                  hideOnMobile: true,
                  formatter: (v: number | null | '') =>
                    v == null || v === ''
                      ? '-'
                      : `${decimalToPercent(v).toLocaleString('pt-BR', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}%`,
                },
              ]}
              fetchData={fetchProducts}
              onAddClick={
                canAdd
                  ? () => {
                      setCurrentProduct(null)
                      setNewProduct({
                        name: '',
                        shorthand: '',
                        description: '',
                        commercialPercentage: null,
                        projectPercentage: null,
                      })
                      setIsModalOpen(true)
                    }
                  : undefined
              }
              addButtonText="Adicionar Produto"
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={canDelete ? handleDelete : undefined}
              data={[]}
            />
          </div>
        </div>
      </main>

      {(canAdd || canEdit) && (
        <EditProduct
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          setNewProduct={setNewProduct}
          newProduct={newProduct}
          setCurrentProduct={setCurrentProduct}
          handleAddProduct={enhancedHandleAddProduct}
          currentProduct={currentProduct}
          isLoading={isMutating}
          disableSave={false}
        />
      )}

      {canDelete && (
        <ExcludeProduct
          isDeleteModalOpen={isDeleteModalOpen}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
          setCurrentProduct={setCurrentProduct}
          confirmDelete={enhancedConfirmDelete}
          currentProduct={currentProduct}
          isLoading={isMutating}
        />
      )}
    </div>
  )
}

export default ProductsPage
