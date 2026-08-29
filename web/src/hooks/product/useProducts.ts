import { useState, useCallback } from 'react'
import { type Product } from '../../types/product'
import { modifierFieldsByType } from '@novadmin/lib/quote/elements'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../services/api/productService'
import { toast } from 'react-toastify'
import { useHasPermission, webPermissions } from '../auth/usePermissions'

export default function useProducts() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isMutating, setIsMutating] = useState(false)
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    shorthand: '',
    description: '',
    typeOnQuote: undefined,
    commercialPercentage: 0,
    projectPercentage: 0,
  })

  const canAdd = useHasPermission(webPermissions.product.add)
  const canEdit = useHasPermission(webPermissions.product.edit)
  const canDelete = useHasPermission(webPermissions.product.delete)

  const fetchProducts = useCallback(
    async (params: { page: number; limit: number }) => {
      const apiParams: any = {
        page: params.page,
        limit: params.limit,
      }

      if (searchTerm) {
        apiParams.generalFuzzyValue = searchTerm
      }

      const response = await getProducts(apiParams)

      return {
        count: response.count,
        data: response.data,
        meta: {
          page: params.page,
          limit: params.limit,
        },
      }
    },
    [searchTerm],
  )

  const handleAddProduct = async () => {
    if ((currentProduct && !canEdit) || (!currentProduct && !canAdd)) {
      toast.error('Você não tem permissão para realizar esta ação')
      return false
    }

    if (!newProduct.name.trim()) {
      toast.error('O nome do produto é obrigatório.')
      return false
    }
    if (!newProduct.shorthand.trim()) {
      toast.error('A sigla do produto é obrigatória.')
      return false
    }
    if (!newProduct.typeOnQuote) {
      toast.error('Selecione o tipo em orçamento do produto.')
      return false
    }

    try {
      setIsMutating(true)

      const type = newProduct.typeOnQuote as keyof typeof modifierFieldsByType
      const allowed = modifierFieldsByType[type] ?? []
      const sanitizedModifiers = newProduct.modifiers
        ? (Object.fromEntries(
            Object.entries(newProduct.modifiers).map(([k, v]) => [
              k,
              allowed.includes(k) ? v : false,
            ]),
          ) as NonNullable<Product['modifiers']>)
        : newProduct.modifiers

      const sanitized = { ...newProduct, modifiers: sanitizedModifiers }

      if (currentProduct) {
        await updateProduct({ ...sanitized, id: currentProduct.id })
        toast.success('Produto atualizado com sucesso!')
      } else {
        await createProduct(sanitized)
        toast.success('Produto adicionado com sucesso!')
      }

      setIsModalOpen(false)
      setCurrentProduct(null)
      setNewProduct({
        name: '',
        shorthand: '',
        description: '',
        typeOnQuote: undefined,
        commercialPercentage: 0,
        projectPercentage: 0,
      })

      return true
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao salvar produto',
      )
      return false
    } finally {
      setIsMutating(false)
    }
  }

  const handleEdit = (product: Product) => {
    if (!canEdit) {
      toast.error('Você não tem permissão para editar produtos')
      return
    }

    setCurrentProduct(product)
    setNewProduct({
      name: product.name,
      shorthand: product.shorthand,
      description: product.description || '',
      typeOnQuote: product.typeOnQuote,
      commercialPercentage: product.commercialPercentage,
      projectPercentage: product.projectPercentage,
      modifiers: product.modifiers,
      consumptionRates: product.consumptionRates,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (product: Product) => {
    if (!canDelete) {
      toast.error('Você não tem permissão para excluir produtos')
      return
    }

    setCurrentProduct(product)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!currentProduct) return false

    try {
      setIsMutating(true)
      await deleteProduct(currentProduct.id)
      toast.success('Produto excluído com sucesso!')
      setIsDeleteModalOpen(false)
      setCurrentProduct(null)
      setApiError(null)
      return true
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      setApiError(
        error instanceof Error ? error.message : 'Erro ao excluir produto',
      )
      return false
    } finally {
      setIsMutating(false)
    }
  }

  return {
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
  }
}
