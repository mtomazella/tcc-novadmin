import { Sql } from 'postgres'
import {
    DatabaseQuoteScope,
    formatFromDatabase,
    UpsertQuoteScopeRecord,
} from '.'
import {
    convertIfPostgresError,
    createPostgresClient,
    validateUpsertParams,
} from '..'
import { getLock } from './lock'
import { UpsertError } from 'error/index'

export const upsert = async ({
    sql: outsideSql,
    userId,
    ignoreLock = false,
    record,
}: {
    sql?: Sql
    userId?: number
    ignoreLock?: boolean
    record: Omit<UpsertQuoteScopeRecord, 'lockedByUserId' | 'lockedAt'>
}) => {
    try {
        validateUpsertParams(record)

        const sql = outsideSql ?? createPostgresClient()
        const runner = sql.begin ? sql.begin : async (cb: any) => cb(sql)

        const query = await runner(async (sql) => {
            if (!ignoreLock && record.id) {
                const lock = await getLock({
                    sql,
                    id: record.id,
                    userId,
                })

                if (lock.isLockedByAnotherUser) {
                    throw new UpsertError(
                        'QuoteScope is locked by another user'
                    )
                }

                if (!lock.isLocked) {
                    throw new UpsertError(
                        'Lock the record before updating it for safety'
                    )
                }
            }

            const query = await sql<DatabaseQuoteScope[]>`
                INSERT INTO quote_scope (
                    id,
                    quote_id,
                    name,
                    supply_type,
                    scope_type,
                    boundary,
                    ceiling_height,
                    project_file_name,
                    gastalho_count,
                    garfo_borda_enabled,
                    garfo_interno_enabled,
                    fundo_adicional_count,
                    tira_adicional_count,
                    observations,
                    overridden_fixed_costs,
                    overridden_product_consumption,
                    materials,
                    material_selections
                ) VALUES (
                    ${record.id ?? sql`DEFAULT`},
                    ${record.quoteId},
                    ${record.name},
                    ${record.supplyType ?? sql`DEFAULT`},
                    ${record.scopeType ?? sql`DEFAULT`},
                    ${record.boundary ?? sql`DEFAULT`},
                    ${record.ceilingHeight ?? sql`DEFAULT`},
                    ${record.projectFileName ?? sql`DEFAULT`},
                    ${record.gastalhoCount ?? sql`DEFAULT`},
                    ${record.garfoBordaEnabled ?? sql`DEFAULT`},
                    ${record.garfoInternoEnabled ?? sql`DEFAULT`},
                    ${record.fundoAdicionalCount ?? sql`DEFAULT`},
                    ${record.tiraAdicionalCount ?? sql`DEFAULT`},
                    ${record.observations ?? sql`DEFAULT`},
                    '${sql.unsafe(
                        record.overriddenFixedCosts
                            ? JSON.stringify(record.overriddenFixedCosts)
                            : 'DEFAULT'
                    )}'::jsonb,
                    '${sql.unsafe(
                        record.overriddenProductConsumption
                            ? JSON.stringify(
                                  record.overriddenProductConsumption
                              )
                            : 'DEFAULT'
                    )}'::jsonb,
                    '${sql.unsafe(
                        record.materials
                            ? JSON.stringify(record.materials)
                            : 'DEFAULT'
                    )}'::jsonb,
                    '${sql.unsafe(
                        record.materialSelections != null
                            ? JSON.stringify(record.materialSelections)
                            : '[]'
                    )}'::jsonb
                )
                ON CONFLICT (id) DO UPDATE SET
                    quote_id = EXCLUDED.quote_id,
                    name = EXCLUDED.name,
                    supply_type = EXCLUDED.supply_type,
                    scope_type = EXCLUDED.scope_type,
                    boundary = EXCLUDED.boundary,
                    ceiling_height = EXCLUDED.ceiling_height,
                    project_file_name = EXCLUDED.project_file_name,
                    gastalho_count = EXCLUDED.gastalho_count,
                    garfo_borda_enabled = EXCLUDED.garfo_borda_enabled,
                    garfo_interno_enabled = EXCLUDED.garfo_interno_enabled,
                    fundo_adicional_count = EXCLUDED.fundo_adicional_count,
                    tira_adicional_count = EXCLUDED.tira_adicional_count,
                    observations = EXCLUDED.observations,
                    overridden_fixed_costs = EXCLUDED.overridden_fixed_costs,
                    overridden_product_consumption = EXCLUDED.overridden_product_consumption,
                    materials = EXCLUDED.materials,
                    material_selections = EXCLUDED.material_selections
                RETURNING *;
            `

            return query
        })
        if (!outsideSql) {
            await sql.end()
        }

        return query.map(formatFromDatabase)
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error upserting quoteScope:', error)
        throw error
    }
}
