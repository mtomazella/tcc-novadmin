import { IncludeDatabaseDates, Quote } from '@novadmin/lib/types'
import config from 'config/index'
import { msToHuman } from 'utils/date'
import { formatFromDatabase as formatClientFromDatabase } from 'data/client'
import { formatFromDatabase as formatObraFromDatabase } from 'data/obra'
import { DatabaseQuote, VersionSummaryElement } from './types'
import { padNumberLeft } from 'utils/string'

export const evaluateLockInformation = ({
    elementsLockedByUserId,
    elementsLockedAt,
    costsLockedByUserId,
    costsLockedAt,
    documentLockedByUserId,
    documentLockedAt,
    userId,
}: {
    elementsLockedByUserId: number | null
    elementsLockedAt: Date | null
    costsLockedByUserId: number | null
    costsLockedAt: Date | null
    documentLockedByUserId: number | null
    documentLockedAt: Date | null
    userId?: number
}) => {
    const evaluatePartialLockInformation = ({
        lockedByUserId,
        lockedAt,
        userId,
    }: {
        lockedByUserId: number | null
        lockedAt: Date | null
        userId?: number
    }) => {
        const timeLocked = lockedAt
            ? new Date().getTime() - new Date(lockedAt).getTime()
            : null
        const isTimeout =
            timeLocked !== null &&
            timeLocked > Number(config.lockTimeoutSeconds) * 1000
        const isLocked = lockedByUserId !== null && !isTimeout

        return {
            isLocked,
            lockedByUserId,
            isLockedByAnotherUser:
                userId && isLocked && lockedByUserId !== userId,
            lockedAt,
            timeLocked,
            timeLockedReadable: timeLocked ? msToHuman(timeLocked) : null,
            isTimeout,
        }
    }

    const {
        isLocked: isElementsLocked,
        lockedByUserId: _,
        isLockedByAnotherUser: isElementsLockedByAnotherUser,
        lockedAt: __,
        timeLocked: elementsTimeLocked,
        timeLockedReadable: elementsTimeLockedReadable,
        isTimeout: isElementsTimeout,
    } = evaluatePartialLockInformation({
        lockedByUserId: elementsLockedByUserId,
        lockedAt: elementsLockedAt,
        userId,
    })

    const {
        isLocked: isCostsLocked,
        lockedByUserId: ___,
        isLockedByAnotherUser: isCostsLockedByAnotherUser,
        lockedAt: ____,
        timeLocked: costsTimeLocked,
        timeLockedReadable: costsTimeLockedReadable,
        isTimeout: isCostsTimeout,
    } = evaluatePartialLockInformation({
        lockedByUserId: costsLockedByUserId,
        lockedAt: costsLockedAt,
        userId,
    })

    const {
        isLocked: isDocumentLocked,
        lockedByUserId: _____,
        isLockedByAnotherUser: isDocumentLockedByAnotherUser,
        lockedAt: ______,
        timeLocked: documentTimeLocked,
        timeLockedReadable: documentTimeLockedReadable,
        isTimeout: isDocumentTimeout,
    } = evaluatePartialLockInformation({
        lockedByUserId: documentLockedByUserId,
        lockedAt: documentLockedAt,
        userId,
    })

    return {
        isElementsLocked,
        isElementsLockedByAnotherUser,
        elementsTimeLocked,
        elementsTimeLockedReadable,
        isElementsTimeout,

        isCostsLocked,
        isCostsLockedByAnotherUser,
        costsTimeLocked,
        costsTimeLockedReadable,
        isCostsTimeout,

        isDocumentLocked,
        isDocumentLockedByAnotherUser,
        documentTimeLocked,
        documentTimeLockedReadable,
        isDocumentTimeout,
    }
}

export const formatFromDatabase = (
    quote: DatabaseQuote,
    userId?: number
): IncludeDatabaseDates<Quote> => {
    let newRecord: any = {
        ...quote,
        parentId: quote.parent_id,
        rootId: quote.root_id,
        versionType: quote.version_type,
        isRoot: quote.is_root,
        isLeaf: quote.is_leaf,
        quoteNumber: quote.quote_number,
        revisionNumber: quote.revision_number,
        additionNumber: quote.addition_number,
        yearCode: quote.year_code,
        clientId: quote.client_id,
        obraId: quote.obra_id,
        createdByUserId: quote.created_by_user_id,
        selectedPricingOptionId: quote.selected_pricing_option_id,
        pricingOptions: quote.pricing_options,
        fixedCosts: quote.fixed_costs,
        productConsumption: quote.product_consumption,
        documentOptions: quote.document_options,
        products: quote.products ?? {},
        elementsLockedByUserId: quote.elements_locked_by_user_id,
        elementsLockedAt: quote.elements_locked_at,
        costsLockedByUserId: quote.costs_locked_by_user_id,
        costsLockedAt: quote.costs_locked_at,
        documentLockedByUserId: quote.document_locked_by_user_id,
        documentLockedAt: quote.document_locked_at,
        createdAt: quote.created_at,
        updatedAt: quote.updated_at,
        deletedAt: quote.deleted_at,
    }

    const formatQuoteNumber = ({
        quoteNumber,
        additionNumber,
        revisionNumber,
        yearCode,
    }: {
        quoteNumber: string
        additionNumber: number
        revisionNumber: number
        yearCode: number
    }) => {
        return [
            'NSC',
            quoteNumber,
            `-${padNumberLeft(yearCode, 2)}`,
            additionNumber ? ` - A${padNumberLeft(additionNumber, 2)}` : '',
            revisionNumber ? ` (R${padNumberLeft(revisionNumber, 2)})` : '',
        ].join('')
    }

    newRecord.formattedQuoteNumber = formatQuoteNumber({
        ...newRecord,
    })

    if (newRecord.client) {
        newRecord.client = formatClientFromDatabase(newRecord.client)
    }

    if (newRecord.obra) {
        newRecord.obra = formatObraFromDatabase(newRecord.obra)
    }

    if (newRecord.version_summary) {
        newRecord.versionSummary = newRecord.version_summary.map(
            (version: VersionSummaryElement) => ({
                ...version,
                formattedQuoteNumber: formatQuoteNumber({
                    ...version,
                }),
            })
        )
    }

    newRecord = {
        ...newRecord,
        ...evaluateLockInformation({
            elementsLockedByUserId: newRecord.elementsLockedByUserId,
            elementsLockedAt: newRecord.elementsLockedAt,
            costsLockedByUserId: newRecord.costsLockedByUserId,
            costsLockedAt: newRecord.costsLockedAt,
            documentLockedByUserId: newRecord.documentLockedByUserId,
            documentLockedAt: newRecord.documentLockedAt,
            userId,
        }),
    }

    delete (newRecord as any).total_count
    delete (newRecord as any).parent_id
    delete (newRecord as any).root_id
    delete (newRecord as any).version_type
    delete (newRecord as any).is_root
    delete (newRecord as any).is_leaf
    delete (newRecord as any).quote_number
    delete (newRecord as any).revision_number
    delete (newRecord as any).addition_number
    delete (newRecord as any).year_code
    delete (newRecord as any).client_id
    delete (newRecord as any).obra_id
    delete (newRecord as any).created_by_user_id
    delete (newRecord as any).selected_pricing_option_id
    delete (newRecord as any).pricing_options
    delete (newRecord as any).fixed_costs
    delete (newRecord as any).product_consumption
    delete (newRecord as any).document_options
    delete (newRecord as any).elements_locked_by_user_id
    delete (newRecord as any).elements_locked_at
    delete (newRecord as any).costs_locked_by_user_id
    delete (newRecord as any).costs_locked_at
    delete (newRecord as any).document_locked_by_user_id
    delete (newRecord as any).document_locked_at
    delete (newRecord as any).version_summary
    delete (newRecord as any).created_at
    delete (newRecord as any).updated_at
    delete (newRecord as any).deleted_at
    return newRecord
}

export * from './types'
export * from './list'
export * from './create'
export * from './update'
export * from './sync'
export * from './import'
export * from './remove'
export * from './lock'
