import { useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { useHasPermission, webPermissions } from '../auth/usePermissions'
import { getFixedCosts, batchUpsertFixedCosts } from '../../services/api/fixedCostService'
import {
  getPricingOptions,
  batchUpsertPricingOptions,
  deletePricingOption,
} from '../../services/api/pricingOptionService'
import type {
  FixedCost,
  PricingOption,
  BatchUpsertFixedCostBody,
  BatchUpsertPricingOptionBody,
} from '../../types/cost'

export function useCostsPage() {
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([])
  const [pricingOptions, setPricingOptions] = useState<PricingOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  const canEdit = useHasPermission(webPermissions.cost.edit)
  const canView = useHasPermission(webPermissions.cost.view)

  const loadData = useCallback(async () => {
    if (!canView) return
    try {
      setIsLoading(true)
      setApiError(null)
      const [fcRes, poRes] = await Promise.all([
        getFixedCosts({ limit: 1000 }),
        getPricingOptions({ limit: 1000, order: 'createdAt_asc' }),
      ])
      setFixedCosts(fcRes.data)
      setPricingOptions(poRes.data)
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao carregar dados'
      setApiError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [canView])

  const saveFixedCosts = async (records: BatchUpsertFixedCostBody['records']): Promise<boolean> => {
    try {
      await batchUpsertFixedCosts(records)
      const fcRes = await getFixedCosts({ limit: 1000 })
      setFixedCosts(fcRes.data)
      toast.success('Custos fixos atualizados com sucesso!')
      return true
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar custos fixos')
      return false
    }
  }

  const savePricingOptions = async (
    records: BatchUpsertPricingOptionBody['records'],
    deletedIds: string[],
  ): Promise<boolean> => {
    try {
      if (deletedIds.length > 0)
        await Promise.all(deletedIds.map(id => deletePricingOption(id)))
      if (records.length > 0)
        await batchUpsertPricingOptions(records)
      const poRes = await getPricingOptions({ limit: 1000, order: 'createdAt_asc' })
      setPricingOptions(poRes.data)
      toast.success('Opções de precificação atualizadas com sucesso!')
      return true
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar opções de precificação')
      return false
    }
  }

  return {
    fixedCosts,
    pricingOptions,
    isLoading,
    apiError,
    loadData,
    saveFixedCosts,
    savePricingOptions,
    canEdit,
    canView,
  }
}
