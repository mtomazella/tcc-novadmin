import type { ImportRequestBody } from '@novadmin/lib/quote/import'
import type { QuoteImportPostResponse } from '../../types/quote'
import api from './api'

const ENDPOINT = '/quote/import'

export const importQuoteScopesAndElements = async (
  body: ImportRequestBody,
): Promise<QuoteImportPostResponse['data']> => {
  const response = await api.post<QuoteImportPostResponse>(ENDPOINT, body)
  return response.data.data
}
