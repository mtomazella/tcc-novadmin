import type {
  LockInformation,
  Quote,
  QuoteElement,
  QuoteFixedCost,
  QuotePricingOption,
  QuoteProductConsumption,
  QuoteScope,
  QuoteScopeProductSnapshotMap,
} from '@novadmin/lib/types'
import type { OrderOptions } from './utils'

export type QuoteRootStatus =
  | 'onlyRoots'
  | 'rootsAndAdditions'
  | 'onlyLeaves'
  | 'all'

export interface QuoteParams {
  id?: number
  parentId?: number
  rootId?: number
  clientId?: number
  obraId?: number
  createdByUserId?: number
  quoteNumber?: string
  revisionNumber?: number
  additionNumber?: number
  yearCode?: number
  rootStatus?: QuoteRootStatus
  generalFuzzyValue?: string
  includeVersionSummary?: boolean
  includeClient?: boolean
  includeObra?: boolean
  activationStatus?: 'active' | 'deleted' | 'all'
  order?: OrderOptions<
    | 'quoteNumber'
    | 'revisionNumber'
    | 'additionNumber'
    | 'yearCode'
    | 'createdAt'
    | 'updatedAt'
  >
  page?: number
  limit?: number
}

export interface QuoteApiItem extends Quote {
  createdAt?: string
  updatedAt?: string
  isElementsLocked?: boolean
  isElementsLockedByAnotherUser?: boolean
  isDocumentLocked?: boolean
  isDocumentLockedByAnotherUser?: boolean
}

export interface QuoteResponse {
  meta: QuoteParams
  count: {
    total: number
    page: number
  }
  data: QuoteApiItem[]
}

export interface QuoteCreateBody {
  clientId: number
  obraId: number
  quoteNumber?: string
  revisionNumber?: number
  additionNumber?: number
  yearCode?: number
}

export interface QuoteCreateResponse {
  data: QuoteApiItem[]
}

export interface QuoteVersionCreateBody {
  parentId: number
}

export interface QuoteVersionCreateResponse {
  meta: QuoteVersionCreateBody
  data: QuoteApiItem[]
}

export interface QuoteListRow extends QuoteApiItem {
  clientName: string
  workName: string
  createdAt: string
  status: string
}

export interface QuoteElementApiItem extends QuoteElement {
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface QuoteElementParams {
  id?: number
  quoteId?: number
  scopeId?: number
  productId?: number
  type?: QuoteElementApiItem['type']
  generalFuzzyValue?: string
  includeProductName?: boolean
  includeProduct?: boolean
  includeScope?: boolean
  activationStatus?: 'active' | 'deleted' | 'all'
  order?: 'updatedAt' | 'createdAt' | 'productId' | 'scopeId' | 'name' | 'type'
  page?: number
  limit?: number
}

export interface QuoteElementResponse {
  meta: QuoteElementParams
  count: {
    total: number
    page: number
    category: Record<string, number>
  }
  data: QuoteElementApiItem[]
}

export interface QuoteElementBatchBody {
  records: QuoteElementApiItem[]
}

export interface QuoteElementDeleteParams {
  id: number
}

export interface QuoteElementLockBody {
  id: number
}

export interface QuoteElementLockResponse {
  meta: QuoteElementLockBody
  data: LockInformation
}

export interface QuoteElementUnlockResponse {
  meta: QuoteElementLockBody
  data: LockInformation
}

export interface QuoteScopeParams {
  id?: number
  quoteId?: number
  generalFuzzyValue?: string
  generalFuzzyFields?: string[]
  activationStatus?: 'active' | 'deleted' | 'all'
  order?: 'name' | 'updatedAt' | 'createdAt'
  page?: number
  limit?: number
}

export interface QuoteScopeApiItem extends QuoteScope {
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface QuoteScopeResponse {
  meta: QuoteScopeParams
  count: {
    total: number
    page: number
  }
  data: QuoteScopeApiItem[]
}

export interface QuoteScopeDeleteParams {
  id: number
}

export interface QuoteScopeDeleteResponse {
  meta: QuoteScopeDeleteParams
  data: QuoteScopeApiItem[]
}

export interface QuoteScopeLockBody {
  id: number
}

export interface QuoteScopeLockResponse {
  meta: QuoteScopeLockBody
  data: LockInformation
}

export interface QuoteScopeUnlockResponse {
  meta: QuoteScopeLockBody
  data: LockInformation
}

export interface QuoteScopeUpsertBody {
  record: QuoteScope
}

export interface QuoteScopeUpsertResponse {
  meta: QuoteScopeUpsertBody
  data: QuoteScopeApiItem[]
}

export interface QuoteImportPostResponse {
  meta: unknown
  data: { scopes: QuoteScope[]; elements: QuoteElement[] }
}

export interface QuoteCostsLockBody {
  id: number
}

export interface QuoteCostsLockResponse {
  meta: QuoteCostsLockBody
  data: LockInformation
}

export interface QuoteCostsUnlockResponse {
  meta: QuoteCostsLockBody
  data: LockInformation
}

export interface QuoteFixedCostsPutBody {
  record: {
    id: number
    fixedCosts: QuoteFixedCost[]
    productConsumption?: QuoteProductConsumption[]
    pricingOptions?: QuotePricingOption[]
    selectedPricingOptionId?: string | null
  }
}

export interface QuoteFixedCostsPutResponse {
  meta: QuoteFixedCostsPutBody
  data: QuoteApiItem[]
}

export interface QuoteProductsPutBody {
  record: { id: number; products: QuoteScopeProductSnapshotMap }
}

export interface QuoteProductsPutResponse {
  meta: QuoteProductsPutBody
  data: QuoteApiItem[]
}
