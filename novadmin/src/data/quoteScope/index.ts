import {
    SnakeCaseKeys,
    IncludeDatabaseDates,
    QuoteScope,
} from '@novadmin/lib/types'
import config from 'config/index'
import { msToHuman } from 'utils/date'

export type DatabaseQuoteScope = SnakeCaseKeys<IncludeDatabaseDates<QuoteScope>>

export type UpsertQuoteScopeRecord = QuoteScope

export type QuoteScopeFuzzyField = 'name'

export const evaluateLockInformation = ({
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
        isLockedByAnotherUser: userId && isLocked && lockedByUserId !== userId,
        lockedAt,
        timeLocked,
        timeLockedReadable: timeLocked ? msToHuman(timeLocked) : null,
        isTimeout,
    }
}

export const formatFromDatabase = (
    quoteScope: DatabaseQuoteScope,
    userId?: number
): IncludeDatabaseDates<QuoteScope> => {
    let newRecord: any = {
        ...quoteScope,
        quoteId: quoteScope.quote_id,
        supplyType: quoteScope.supply_type,
        scopeType: quoteScope.scope_type,
        ceilingHeight: quoteScope.ceiling_height,
        projectFileName: quoteScope.project_file_name,
        gastalhoCount: quoteScope.gastalho_count,
        garfoBordaEnabled: quoteScope.garfo_borda_enabled,
        garfoInternoEnabled: quoteScope.garfo_interno_enabled,
        fundoAdicionalCount: quoteScope.fundo_adicional_count,
        tiraAdicionalCount: quoteScope.tira_adicional_count,
        observations: quoteScope.observations,
        overriddenFixedCosts: quoteScope.overridden_fixed_costs,
        overriddenProductConsumption: quoteScope.overridden_product_consumption,
        materialSelections: quoteScope.material_selections,
        lockedByUserId: quoteScope.locked_by_user_id,
        lockedAt: quoteScope.locked_at,
        createdAt: quoteScope.created_at,
        updatedAt: quoteScope.updated_at,
        deletedAt: quoteScope.deleted_at,
    }

    newRecord = {
        ...newRecord,
        ...evaluateLockInformation({
            lockedByUserId: newRecord.lockedByUserId ?? null,
            lockedAt: newRecord.lockedAt ?? null,
            userId,
        }),
    }

    delete (newRecord as any).total_count
    delete (newRecord as any).quote_id
    delete (newRecord as any).supply_type
    delete (newRecord as any).scope_type
    delete (newRecord as any).ceiling_height
    delete (newRecord as any).project_file_name
    delete (newRecord as any).gastalho_count
    delete (newRecord as any).garfo_borda_enabled
    delete (newRecord as any).garfo_interno_enabled
    delete (newRecord as any).fundo_adicional_count
    delete (newRecord as any).tira_adicional_count
    delete (newRecord as any).overridden_fixed_costs
    delete (newRecord as any).overridden_product_consumption
    delete (newRecord as any).material_selections
    delete (newRecord as any).locked_by_user_id
    delete (newRecord as any).locked_at
    delete (newRecord as any).created_at
    delete (newRecord as any).updated_at
    delete (newRecord as any).deleted_at
    return newRecord
}

export * from './list'
export * from './upsert'
export * from './remove'
export * from './lock'
