import { SelectError, UpsertError } from 'error/index'
import postgres, { PostgresError } from 'postgres'

export const createPostgresClient = () => {
    if (!process.env.POSTGRES_USER) {
        throw new Error('POSTGRES_USER is not set')
    }
    if (!process.env.POSTGRES_PASSWORD) {
        throw new Error('POSTGRES_PASSWORD is not set')
    }
    return postgres({
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        database: process.env.DB_NAME ?? process.env.POSTGRES_USER,
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
    })
}

export const generateGeneralFuzzyClause = ({
    sql,
    fields,
    value,
    tablePrefix,
}: {
    sql: postgres.Sql
    fields: string[]
    value: string
    tablePrefix?: string
}) => {
    const hasGeneralFuzzy = fields.length > 0

    const stringGeneralFuzzyClause = fields?.length
        ? '(' +
          fields
              .map(
                  (field) =>
                      `${tablePrefix ?? ''}${field} ILIKE '${'%' + value + '%'}'`
              )
              .join(' OR ') +
          ')'
        : ''

    const generalFuzzyClause = fields?.length
        ? sql.unsafe(stringGeneralFuzzyClause)
        : sql``

    return {
        hasGeneralFuzzy,
        generalFuzzyClause,
        stringGeneralFuzzyClause,
    }
}

export const generateSpecificFuzzyClause = ({
    sql,
    fields,
    tablePrefix,
}: {
    sql: postgres.Sql
    fields: Record<string, string | undefined>
    tablePrefix?: string
}) => {
    const hasSpecificFuzzy = Object.entries(fields ?? {}).some(
        ([_, value]) => !!value
    )
    const specificFuzzyClause = sql.unsafe(
        Object.entries(fields ?? {})
            .filter(([_, value]) => !!value)
            .map(
                ([field, value]) =>
                    `${tablePrefix ?? ''}${field} ILIKE '${'%' + value + '%'}'`
            )
            .join(' AND ')
    )

    return {
        hasSpecificFuzzy,
        specificFuzzyClause,
    }
}

export const getEntityFuzzyFields = (
    fields: string[] | undefined,
    prefix: string
) => {
    if (!prefix) {
        return fields?.filter((field) => !field.includes('_')) ?? []
    }

    return (
        fields
            ?.filter((field) => field.startsWith(`${prefix}_`))
            .map((field) => field.replace(`${prefix}_`, '')) || []
    )
}

export const getOrderByClause = ({
    order,
    map,
    default: defaultOrder,
}: {
    order: string
    map: Record<string, string>
    default?: string
}) => {
    const orderKey = (order ?? defaultOrder).trim().toLowerCase().split('_')[0]
    const orderDirection = order.includes('_desc') ? 'DESC' : 'ASC'

    const lowercaseMap = Object.keys(map).reduce(
        (acc, key) => {
            acc[key.toLowerCase()] = map[key]
            return acc
        },
        {} as Record<string, string>
    )

    const mappedOrder = lowercaseMap[orderKey]
    if (!mappedOrder) {
        throw new Error('Invalid order key')
    }

    return `ORDER BY ${mappedOrder} ${orderDirection}`
}

export const validateListParams = (params: any) => {
    if (params.page < 1) {
        throw new Error('Page must be greater than 0')
    }

    if (
        params.generalFuzzy?.fields?.length &&
        Object.values(params.fuzzy ?? {}).filter((v: any) => !!v).length
    ) {
        throw new SelectError(
            'If using general fuzzy search, do not use other fuzzy search'
        )
    }
}

export const validateUpsertParams = (record: any) => {
    if (record.createdAt) {
        throw new UpsertError('Cannot set createdAt')
    }
    if (record.updatedAt) {
        throw new UpsertError('Cannot set updatedAt')
    }
    if (record.deletedAt) {
        throw new UpsertError(
            'You are not allowed to set deletedAt here. Use the remove operation.'
        )
    }
}

export const convertIfPostgresError = (error: unknown) => {
    if (!(error instanceof PostgresError)) {
        return
    }
    if (error.code === '23505') {
        throw new UpsertError('Record with unique identifiers already exists')
    }
    if (error.code === '22001') {
        throw new UpsertError('Record data exceeds maximum length')
    }
    if (error.code === '23503') {
        throw new UpsertError('Foreign key constraint violation.')
    }
}
