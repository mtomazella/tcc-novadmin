import { QuoteSyncOptions } from 'data/quote/sync'
import { Quote } from '@novadmin/lib/types'

export type QuoteSyncPostBody = {} & QuoteSyncOptions

export type QuoteSyncPostParams = QuoteSyncPostBody & {}

export type QuoteSyncPostResponse =
    | {
          meta: QuoteSyncPostParams
          data: Quote[]
      }
    | {
          error: string
          details?: any
      }
