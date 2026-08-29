import api from './api'
import type {
  PricingOption,
  PricingOptionParams,
  PricingOptionResponse,
  BatchUpsertPricingOptionBody,
} from '../../types/cost'

const ENDPOINT = '/quote/pricingOption'

export const getPricingOptions = async (
  params?: PricingOptionParams,
): Promise<PricingOptionResponse> => {
  const response = await api.get<PricingOptionResponse>(ENDPOINT, { params })
  return response.data
}

export const batchUpsertPricingOptions = async (
  records: BatchUpsertPricingOptionBody['records'],
): Promise<PricingOption[]> => {
  const response = await api.post<{ data: PricingOption[] }>(`${ENDPOINT}/batch`, { records })
  return response.data.data
}

export const deletePricingOption = async (id: string): Promise<void> => {
  await api.delete(ENDPOINT, { params: { id } })
}
