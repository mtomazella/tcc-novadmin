import { DatabaseQuotePricingOption, formatFromDatabase } from '.'
import { convertIfPostgresError, createPostgresClient } from '..'

export const remove = async ({ id }: { id: number }) => {
    try {
        const sql = createPostgresClient()

        const quotePricingOption = await sql<DatabaseQuotePricingOption[]>`
            UPDATE quote_pricing_option SET deleted_at = NOW() WHERE id = ${id} RETURNING *;
        `
        await sql.end()

        return {
            quotePricingOption: quotePricingOption.map(formatFromDatabase),
        }
    } catch (error) {
        convertIfPostgresError(error)
        console.error('Error soft deleting quotePricingOption:', error)
        throw error
    }
}
