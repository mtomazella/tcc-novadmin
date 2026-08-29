import type { QuotePricingOption } from '../types/quote.js'

export type QuotePricingOptionRow = {
    id: string
    name: string
    description?: string
    valueReto: number
    valueCambotado: number
    valueGarfo: number
    baseValueReto?: number
    baseValueCambotado?: number
    baseValueGarfo?: number
    isQuoteSpecific: boolean
}

export const generateNextPricingOptionId = (
    options: QuotePricingOption[]
): number => {
    const maxId = options.reduce((max, opt) => {
        if (opt.id === undefined) return max
        const n = parseInt(opt.id, 10)
        return isNaN(n) ? max : Math.max(max, n)
    }, 0)
    return maxId + 1
}

export const generateNextQuoteSpecificOptionId = (
    options: QuotePricingOption[]
): string => {
    const existingQuoteIds = options
        .map((opt) => opt.id)
        .filter(
            (id): id is string => id !== undefined && id.startsWith('quote-')
        )
        .map((id) => parseInt(id.slice('quote-'.length), 10))
        .filter((n) => !isNaN(n))
    const maxN = existingQuoteIds.reduce((max, n) => Math.max(max, n), 0)
    return `quote-${maxN + 1}`
}

export const toQuotePricingOptionRows = ({
    basePricingOptions,
    overriddenPricingOptions,
}: {
    basePricingOptions: QuotePricingOption[]
    overriddenPricingOptions: QuotePricingOption[]
}): QuotePricingOptionRow[] => {
    const globalById = new Map(
        basePricingOptions
            .filter(
                (opt): opt is QuotePricingOption & { id: string } =>
                    opt.id !== undefined
            )
            .map((opt) => [opt.id, opt])
    )
    const overrideById = new Map(
        overriddenPricingOptions
            .filter(
                (opt): opt is QuotePricingOption & { id: string } =>
                    opt.id !== undefined
            )
            .map((opt) => [opt.id, opt])
    )

    const rows: QuotePricingOptionRow[] = []
    const matchedOverrideIds = new Set<string>()

    for (const globalOpt of basePricingOptions) {
        if (globalOpt.id === undefined) continue

        const override = overrideById.get(globalOpt.id)
        if (override) {
            matchedOverrideIds.add(globalOpt.id)
        }

        const effective = override ?? globalOpt

        rows.push({
            id: globalOpt.id,
            name: effective.name,
            description: effective.description,
            valueReto: effective.valueReto,
            valueCambotado: effective.valueCambotado,
            valueGarfo: effective.valueGarfo,
            baseValueReto: globalOpt.valueReto,
            baseValueCambotado: globalOpt.valueCambotado,
            baseValueGarfo: globalOpt.valueGarfo,
            isQuoteSpecific: false,
        })
    }

    for (const override of overriddenPricingOptions) {
        if (override.id !== undefined && globalById.has(override.id)) continue
        if (override.id !== undefined && matchedOverrideIds.has(override.id))
            continue

        const id =
            override.id ??
            generateNextQuoteSpecificOptionId([
                ...basePricingOptions,
                ...overriddenPricingOptions,
            ])

        rows.push({
            id,
            name: override.name,
            description: override.description,
            valueReto: override.valueReto,
            valueCambotado: override.valueCambotado,
            valueGarfo: override.valueGarfo,
            isQuoteSpecific: true,
        })
    }

    return rows
}
