import type { QuoteFile } from '@novadmin/lib/types'
import api from './api'

const ENDPOINT = '/quote/file'

interface QuoteFileListResponse {
  data: QuoteFile[]
  count: { total: number; page: number }
}

interface QuoteFilePostResponse {
  meta: Record<string, unknown>
  data: QuoteFile[]
}

export const getQuoteFiles = async (quoteId: number): Promise<QuoteFile[]> => {
  const response = await api.get<QuoteFileListResponse>(ENDPOINT, {
    params: { quoteId, limit: 999 },
  })
  return response.data.data
}

export const getQuoteFileWithContent = async (
  id: number,
): Promise<QuoteFile> => {
  const response = await api.get<QuoteFileListResponse>(ENDPOINT, {
    params: { id, includeContent: true },
  })
  const file = response.data.data[0]
  if (!file) throw new Error(`Quote file ${id} not found`)
  return file
}

export const uploadQuoteFile = async (
  quoteId: number,
  name: string,
  fileContent: string,
): Promise<QuoteFile> => {
  const response = await api.post<QuoteFilePostResponse>(ENDPOINT, {
    record: { quoteId, name, fileContent },
  })
  const file = response.data.data[0]
  if (!file) throw new Error('Failed to upload quote file')
  return file
}

export const deleteQuoteFile = async (id: number): Promise<void> => {
  await api.delete(ENDPOINT, { params: { id } })
}
