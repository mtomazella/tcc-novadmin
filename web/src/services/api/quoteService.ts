import api from './api'
import type {
  QuoteApiItem,
  QuoteCostsLockBody,
  QuoteCostsLockResponse,
  QuoteCostsUnlockResponse,
  QuoteElementApiItem,
  QuoteElementBatchBody,
  QuoteElementDeleteParams,
  QuoteElementLockBody,
  QuoteElementLockResponse,
  QuoteElementParams,
  QuoteElementResponse,
  QuoteElementUnlockResponse,
  QuoteCreateBody,
  QuoteCreateResponse,
  QuoteFixedCostsPutBody,
  QuoteFixedCostsPutResponse,
  QuoteProductsPutBody,
  QuoteProductsPutResponse,
  QuoteParams,
  QuoteResponse,
  QuoteScopeLockBody,
  QuoteScopeLockResponse,
  QuoteScopeParams,
  QuoteScopeResponse,
  QuoteScopeUnlockResponse,
  QuoteScopeDeleteResponse,
  QuoteScopeUpsertResponse,
  QuoteScopeApiItem,
  QuoteVersionCreateBody,
  QuoteVersionCreateResponse,
} from '../../types/quote'

const ENDPOINT = '/quote'

export const getQuotes = async (
  params?: QuoteParams,
): Promise<QuoteResponse> => {
  const response = await api.get<QuoteResponse>(ENDPOINT, { params })
  return response.data
}

export const deleteQuote = async (id: number): Promise<void> => {
  await api.delete(ENDPOINT, { params: { id } })
}

export const createQuote = async (body: QuoteCreateBody) => {
  const response = await api.post<QuoteCreateResponse>(ENDPOINT, body)
  return response.data.data
}

export const createQuoteRevision = async (
  parentId: number,
): Promise<QuoteApiItem[]> => {
  const body: QuoteVersionCreateBody = { parentId }
  const response = await api.post<QuoteVersionCreateResponse>(
    `${ENDPOINT}/revision`,
    body,
  )
  return response.data.data
}

export const createQuoteAddition = async (
  parentId: number,
): Promise<QuoteApiItem[]> => {
  const body: QuoteVersionCreateBody = { parentId }
  const response = await api.post<QuoteVersionCreateResponse>(
    `${ENDPOINT}/addition`,
    body,
  )
  return response.data.data
}

export const getQuoteById = async (id: number): Promise<QuoteResponse> => {
  const response = await api.get<QuoteResponse>(ENDPOINT, {
    params: { id, includeClient: true, includeObra: true },
  })
  return response.data
}

const ELEMENTS_ENDPOINT = `${ENDPOINT}/element`
const SCOPES_ENDPOINT = `${ENDPOINT}/scope`
const LOCK_ENDPOINT = `${ENDPOINT}/lock/elements`
const UNLOCK_ENDPOINT = `${ENDPOINT}/unlock/elements`
const LOCK_COSTS_ENDPOINT = `${ENDPOINT}/lock/costs`
const UNLOCK_COSTS_ENDPOINT = `${ENDPOINT}/unlock/costs`
const FIXED_COSTS_ENDPOINT = `${ENDPOINT}/fixedCosts`
const ELEMENTS_PAGE_SIZE = 1000
const SCOPES_PAGE_SIZE = 1000

export const getQuoteElements = async (
  params?: Omit<QuoteElementParams, 'page' | 'limit'>,
): Promise<QuoteElementResponse> => {
  let page = 1
  let allData: QuoteElementApiItem[] = []
  let latestResponse: QuoteElementResponse

  do {
    const response = await api.get<QuoteElementResponse>(ELEMENTS_ENDPOINT, {
      params: { ...params, page, limit: ELEMENTS_PAGE_SIZE },
    })
    latestResponse = response.data
    allData = allData.concat(latestResponse.data ?? [])
    page += 1
  } while (allData.length < latestResponse.count.total)

  return { ...latestResponse, data: allData }
}

export const batchUpsertQuoteElements = async (
  records: QuoteElementApiItem[],
): Promise<QuoteElementApiItem[]> => {
  const payload: QuoteElementBatchBody = { records }
  const response = await api.post<{ data: QuoteElementApiItem[] }>(
    `${ELEMENTS_ENDPOINT}/batch`,
    payload,
  )
  return response.data.data
}

export const deleteQuoteElement = async (
  params: QuoteElementDeleteParams,
): Promise<void> => {
  await api.delete(ELEMENTS_ENDPOINT, { params })
}

export const lockQuoteElements = async (
  body: QuoteElementLockBody,
): Promise<QuoteElementLockResponse['data']> => {
  const response = await api.post<QuoteElementLockResponse>(LOCK_ENDPOINT, body)
  return response.data.data
}

export const unlockQuoteElements = async (
  body: QuoteElementLockBody,
): Promise<QuoteElementUnlockResponse['data']> => {
  const response = await api.post<QuoteElementUnlockResponse>(
    UNLOCK_ENDPOINT,
    body,
  )
  return response.data.data
}

export const getQuoteScopes = async (
  params?: Omit<QuoteScopeParams, 'page' | 'limit'>,
): Promise<QuoteScopeResponse> => {
  let page = 1
  let allData: QuoteScopeApiItem[] = []
  let latestResponse: QuoteScopeResponse

  do {
    const response = await api.get<QuoteScopeResponse>(SCOPES_ENDPOINT, {
      params: { ...params, page, limit: SCOPES_PAGE_SIZE },
    })
    latestResponse = response.data
    allData = allData.concat(latestResponse.data ?? [])
    page += 1
  } while (allData.length < latestResponse.count.total)

  return { ...latestResponse, data: allData }
}

export const deleteQuoteScope = async (id: number): Promise<void> => {
  await api.delete<QuoteScopeDeleteResponse>(SCOPES_ENDPOINT, {
    params: { id },
  })
}

export const lockQuoteScope = async (
  body: QuoteScopeLockBody,
): Promise<QuoteScopeLockResponse['data']> => {
  const response = await api.post<QuoteScopeLockResponse>(
    `${SCOPES_ENDPOINT}/lock`,
    body,
  )
  return response.data.data
}

export const unlockQuoteScope = async (
  body: QuoteScopeLockBody,
): Promise<QuoteScopeUnlockResponse['data']> => {
  const response = await api.post<QuoteScopeUnlockResponse>(
    `${SCOPES_ENDPOINT}/unlock`,
    body,
  )
  return response.data.data
}

export const lockQuoteCosts = async (
  body: QuoteCostsLockBody,
): Promise<QuoteCostsLockResponse['data']> => {
  const response = await api.post<QuoteCostsLockResponse>(
    LOCK_COSTS_ENDPOINT,
    body,
  )
  return response.data.data
}

export const unlockQuoteCosts = async (
  body: QuoteCostsLockBody,
): Promise<QuoteCostsUnlockResponse['data']> => {
  const response = await api.post<QuoteCostsUnlockResponse>(
    UNLOCK_COSTS_ENDPOINT,
    body,
  )
  return response.data.data
}

export const updateQuoteProducts = async (
  body: QuoteProductsPutBody,
): Promise<QuoteApiItem[]> => {
  const response = await api.put<QuoteProductsPutResponse>(ENDPOINT, body)
  return response.data.data
}

export const updateQuoteFixedCosts = async (
  body: QuoteFixedCostsPutBody,
): Promise<QuoteApiItem[]> => {
  const response = await api.put<QuoteFixedCostsPutResponse>(
    FIXED_COSTS_ENDPOINT,
    body,
  )
  return response.data.data
}

export const upsertQuoteScope = async (
  record: Record<string, unknown>,
): Promise<QuoteScopeApiItem[]> => {
  const response = await api.post<QuoteScopeUpsertResponse>(SCOPES_ENDPOINT, {
    record,
  })

  return response.data.data
}

const DOCUMENT_ENDPOINT = `${ENDPOINT}/document`
const LOCK_DOCUMENT_ENDPOINT = `${ENDPOINT}/lock/document`
const UNLOCK_DOCUMENT_ENDPOINT = `${ENDPOINT}/unlock/document`

export const lockQuoteDocument = async (body: {
  id: number
}): Promise<unknown> => (await api.post(LOCK_DOCUMENT_ENDPOINT, body)).data

export const unlockQuoteDocument = async (body: {
  id: number
}): Promise<unknown> => (await api.post(UNLOCK_DOCUMENT_ENDPOINT, body)).data

export const updateQuoteDocument = async (body: {
  record: { id: number; documentOptions: Record<string, unknown> }
}): Promise<unknown> => (await api.put(DOCUMENT_ENDPOINT, body)).data
