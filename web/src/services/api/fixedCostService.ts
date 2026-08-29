import api from './api'
import type {
  FixedCost,
  FixedCostParams,
  FixedCostResponse,
  BatchUpsertFixedCostBody,
} from '../../types/cost'

const ENDPOINT = '/quote/fixedCost'

export const getFixedCosts = async (params?: FixedCostParams): Promise<FixedCostResponse> => {
  const response = await api.get<FixedCostResponse>(ENDPOINT, { params })
  return response.data
}

export const batchUpsertFixedCosts = async (
  records: BatchUpsertFixedCostBody['records'],
): Promise<FixedCost[]> => {
  const response = await api.post<{ data: FixedCost[] }>(`${ENDPOINT}/batch`, { records })
  return response.data.data
}
