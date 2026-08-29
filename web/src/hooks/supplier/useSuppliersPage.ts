import { useState, useCallback, useRef } from 'react'
import { toast } from 'react-toastify'
import { centsToReais } from '@novadmin/lib/utils/unitConversion'
import type { Supplier, EditingMaterial } from '../../types/supplier'
import { useHasPermission, webPermissions } from '../auth/usePermissions'
import * as supplierService from '../../services/api/supplierService'
import * as materialService from '../../services/api/materialService'

export function useSuppliersPage() {
  const tableRef = useRef<{ refresh: () => void }>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplierId, setEditingSupplierId] = useState<
    number | undefined
  >(undefined)
  const [initialName, setInitialName] = useState('')
  const [initialMaterials, setInitialMaterials] = useState<EditingMaterial[]>(
    [],
  )

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null,
  )

  const [isMutating, setIsMutating] = useState(false)

  const canEdit = useHasPermission(webPermissions.supplier.edit)
  const canDelete = useHasPermission(webPermissions.supplier.delete)

  const fetchSuppliers = useCallback(
    async (params: { page: number; limit: number }) => {
      const response = await supplierService.getSuppliers({
        ...params,
        generalFuzzyValue: searchTerm || undefined,
      })

      const dataWithMaterialCount = await Promise.all(
        response.data.map(async supplier => {
          try {
            const materialsResponse = await materialService.getMaterials({
              supplierId: supplier.id,
              limit: 1,
            })
            return {
              ...supplier,
              materialCount: materialsResponse?.count?.total || 0,
            }
          } catch {
            return { ...supplier, materialCount: 0 }
          }
        }),
      )

      return {
        count: response.count.total,
        data: dataWithMaterialCount,
        meta: response.meta,
      }
    },
    [searchTerm],
  )

  const openCreate = () => {
    setEditingSupplierId(undefined)
    setInitialName('')
    setInitialMaterials([])
    setIsModalOpen(true)
  }

  const openEdit = async (supplier: Supplier) => {
    if (!canEdit) {
      toast.error('Você não tem permissão para editar fornecedores')
      return
    }
    try {
      const [supplierResponse, materialsResponse] = await Promise.all([
        supplierService.getSuppliers({ id: supplier.id }),
        materialService.getMaterials({ supplierId: supplier.id, limit: 10000 }),
      ])

      const supplierData = supplierResponse.data[0]

      setEditingSupplierId(supplierData.id)
      setInitialName(supplierData.name)
      setInitialMaterials(
        materialsResponse.data.map(m => ({
          id: m.id,
          sku: m.sku,
          name: m.name,
          description: m.description || '',
          type: m.type,
          value: centsToReais(m.value),
        })),
      )
      setIsModalOpen(true)
    } catch (error) {
      console.error('Erro ao carregar fornecedor para edição:', error)
      toast.error('Erro ao carregar dados do fornecedor')
    }
  }

  const saveSupplier = async (
    name: string,
    materials: EditingMaterial[],
    deletedIds: number[],
  ) => {
    if (!canEdit) {
      toast.error('Você não tem permissão para realizar esta ação')
      return
    }
    try {
      setIsMutating(true)
      setApiError(null)

      const savedSupplier = await supplierService.upsertSupplier({
        id: editingSupplierId,
        name,
      })
      const supplierId = savedSupplier.id!

      const validMaterials = materials.filter(m => m.sku.trim())
      if (validMaterials.length > 0) {
        await materialService.batchUpsertMaterials(validMaterials, supplierId)
      }

      for (const id of deletedIds) {
        await materialService.deleteMaterial(id)
      }

      toast.success(
        editingSupplierId
          ? 'Fornecedor atualizado com sucesso!'
          : 'Fornecedor adicionado com sucesso!',
      )
      setIsModalOpen(false)
      tableRef.current?.refresh()
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Erro ao salvar fornecedor'
      setApiError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsMutating(false)
    }
  }

  const openDelete = (supplier: Supplier) => {
    if (!canDelete) {
      toast.error('Você não tem permissão para excluir fornecedores')
      return
    }
    setSupplierToDelete(supplier)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!supplierToDelete?.id) return
    try {
      setIsMutating(true)
      await supplierService.deleteSupplier(supplierToDelete.id)
      toast.success('Fornecedor excluído com sucesso!')
      setIsDeleteModalOpen(false)
      setSupplierToDelete(null)
      setApiError(null)
      tableRef.current?.refresh()
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Erro ao excluir fornecedor'
      setApiError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsMutating(false)
    }
  }

  return {
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
  }
}
