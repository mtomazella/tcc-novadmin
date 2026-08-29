import api from './api'
import { reaisToCents } from '@novadmin/lib/utils/unitConversion'
import type {
  Material,
  MaterialParams,
  MaterialResponse,
  EditingMaterial,
} from '../../types/supplier'

const ENDPOINT = '/material'

export const getMaterials = async (
  params?: MaterialParams,
): Promise<MaterialResponse> => {
  const response = await api.get<MaterialResponse>(ENDPOINT, { params })
  return response.data
}

export const batchUpsertMaterials = async (
  materials: EditingMaterial[],
  supplierId: number,
): Promise<Material[]> => {
  const validMaterials = materials.filter(m => m.sku.trim())
  if (validMaterials.length === 0) return []

  const records = validMaterials.map(m => ({
    id: m.id,
    supplierId,
    sku: m.sku.substring(0, 50),
    name: m.name.substring(0, 100),
    description: (m.description || '').substring(0, 200),
    type: m.type,
    value: reaisToCents(typeof m.value === 'number' ? m.value : 0),
  }))

  const response = await api.post<{ data: Material[] }>(`${ENDPOINT}/batch`, {
    records,
  })
  return response.data.data
}

export const deleteMaterial = async (id: number): Promise<void> => {
  await api.delete(ENDPOINT, { params: { id } })
}
