import {
    SnakeCaseKeys,
    IncludeDatabaseDates,
    QuoteFile,
} from '@novadmin/lib/types'

export type DatabaseQuoteFile = SnakeCaseKeys<IncludeDatabaseDates<QuoteFile>>

export type UpsertQuoteFileRecord = Omit<QuoteFile, 'uploadedBy'>

export const formatFromDatabase = (
    row: DatabaseQuoteFile & { total_count?: number }
): IncludeDatabaseDates<QuoteFile> => {
    const newRecord: IncludeDatabaseDates<QuoteFile> = {
        ...row,
        quoteId: row.quote_id,
        fileContent: row.file_content
            ? Buffer.from(row.file_content as unknown as Uint8Array).toString(
                  'utf8'
              )
            : null,
        uploadedBy: row.uploaded_by ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
    }

    delete (newRecord as any).total_count
    delete (newRecord as any).quote_id
    delete (newRecord as any).file_content
    delete (newRecord as any).uploaded_by
    delete (newRecord as any).created_at
    delete (newRecord as any).updated_at
    delete (newRecord as any).deleted_at
    return newRecord
}

export * from './list'
export * from './upsert'
export * from './remove'
