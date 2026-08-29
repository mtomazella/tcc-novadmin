import api from './api'
import type {
  Supplier,
  SupplierParams,
  SupplierResponse,
} from '../../types/supplier'

const ENDPOINT = '/supplier'

export const getSuppliers = async (
  params?: SupplierParams,
): Promise<SupplierResponse> => {
  const response = await api.get<SupplierResponse>(ENDPOINT, { params })
  return response.data
}

export const upsertSupplier = async (record: {
  id?: number
  name: string
}): Promise<Supplier> => {
  const response = await api.post<{ data: Supplier[] }>(ENDPOINT, {
    record: { id: record.id, name: record.name.substring(0, 115) },
  })
  const supplier = response?.data?.data?.[0]
  if (!supplier) throw new Error('Supplier upsert returned no data')
  return supplier
}

export const deleteSupplier = async (id: number): Promise<void> => {
  await api.delete(ENDPOINT, { params: { id } })
}
