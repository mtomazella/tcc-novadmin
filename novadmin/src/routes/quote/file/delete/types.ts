import { QuoteFile } from '@novadmin/lib/types'

export type QuoteFileDeleteRequest = {
    id: number
}

export type QuoteFileDeleteParams = QuoteFileDeleteRequest & {}

export type QuoteFileDeleteResponse =
    | {
          meta: QuoteFileDeleteParams
          data: {
              quoteFile: (Omit<QuoteFile, 'fileContent'> & {
                  createdAt: Date
                  updatedAt: Date
                  deletedAt?: Date | null
              })[]
          }
      }
    | {
          error: string
          details?: any
      }
