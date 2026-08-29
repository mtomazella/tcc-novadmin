import type { Material, Product } from 'types/index.js'
import type { Quote, QuoteFixedCost, QuoteScope } from 'types/quote.js'
import { splitCategory } from './groupedElements.js'

/**
 * @param overrideLevel - Includes the overrides until that point in the hierarchy. For example, if 'quote' is selected, only the fixedCosts and Quote values are applied, scope is ignored.
 */
export const getOverriddenFixedCosts = ({
    fixedCosts,
    quote,
    scope,
    overrideLevel = 'scope',
}: {
    fixedCosts: QuoteFixedCost[]
    quote?: Quote
    scope?: QuoteScope
    overrideLevel: 'scope' | 'quote' | 'fixedCosts'
}) => {
    if (overrideLevel === 'quote' || overrideLevel === 'scope') {
        if (!quote)
            throw new Error('Quote data is required for quote level overrides')
    }
    if (overrideLevel === 'scope') {
        if (!scope)
            throw new Error('Scope data is required for scope level overrides')
    }

    const quoteOverrideMap = new Map(quote?.fixedCosts?.map((o) => [o.id, o]))
    const scopeOverrideMap = new Map(
        scope?.overriddenFixedCosts?.map((o) => [o.id, o])
    )

    return fixedCosts.map((cost) => {
        const quoteOverride =
            overrideLevel !== 'fixedCosts'
                ? quoteOverrideMap.get(cost.id)
                : undefined
        const scopeOverride =
            overrideLevel === 'scope'
                ? scopeOverrideMap.get(cost.id)
                : undefined
        if (!quoteOverride && !scopeOverride) return cost
        return {
            ...cost,
            value: scopeOverride?.value ?? quoteOverride?.value ?? cost.value,
        }
    })
}

const applyRateOverrides = (
    base: Product['consumptionRates'],
    override: Partial<Product['consumptionRates']> | undefined
): Product['consumptionRates'] => {
    if (!override) return base
    const merged = { ...base }
    for (const key of Object.keys(override) as (keyof typeof base)[]) {
        const value = override[key]
        if (value != null) merged[key] = value
    }
    return merged
}

export const getOverriddenProductConsumption = ({
    product,
    quote,
    scope,
    overrideLevel = 'scope',
}: {
    product: Product
    quote?: Quote
    scope?: QuoteScope
    overrideLevel: 'scope' | 'quote' | 'product'
}) => {
    let consumptionRates = { ...(product.consumptionRates ?? {}) }
    let commercialPercentage: number | null =
        product.commercialPercentage ?? null
    let projectPercentage: number | null = product.projectPercentage ?? null

    if (overrideLevel === 'quote' || overrideLevel === 'scope') {
        if (!quote)
            throw new Error('Quote data is required for quote level overrides')

        const quoteOverride = quote.productConsumption?.find(
            (override) =>
                splitCategory(override.category ?? '').productId === product.id
        )
        if (quoteOverride) {
            consumptionRates = applyRateOverrides(
                consumptionRates,
                quoteOverride.consumptionRates
            )
            if (quoteOverride.commercialPercentage != null)
                commercialPercentage = quoteOverride.commercialPercentage
            if (quoteOverride.projectPercentage != null)
                projectPercentage = quoteOverride.projectPercentage
        }
    }

    if (overrideLevel === 'scope') {
        if (!scope)
            throw new Error('Scope data is required for scope level overrides')

        const scopeOverride = scope.overriddenProductConsumption.find(
            (override) =>
                splitCategory(override.category ?? '').productId === product.id
        )
        if (scopeOverride) {
            consumptionRates = applyRateOverrides(
                consumptionRates,
                scopeOverride.consumptionRates
            )
            if (scopeOverride.commercialPercentage != null)
                commercialPercentage = scopeOverride.commercialPercentage
            if (scopeOverride.projectPercentage != null)
                projectPercentage = scopeOverride.projectPercentage
        }
    }

    return { consumptionRates, commercialPercentage, projectPercentage }
}

export const getOverriddenMaterialSelectionValue = ({
    material,
    scope,
    category,
    overriddenLevel = 'scope_selection',
}: {
    material: Material
    scope?: QuoteScope
    category: string
    overriddenLevel: 'scope_selection' | 'scope_snapshot' | 'material'
}) => {
    let result = material.value

    if (overriddenLevel.includes('scope')) {
        if (!scope)
            throw new Error('Scope data is required for scope level overrides')

        const scopeMaterial = scope.materials[material.id as number]

        if (scopeMaterial) {
            result = scopeMaterial.value
        }
    }

    if (overriddenLevel === 'scope_selection') {
        if (!scope)
            throw new Error('Scope data is required for scope level overrides')
        if (!category)
            throw new Error(
                'Category is required for scope selection overrides'
            )

        const selection = scope.materialSelections.find(
            (selection) => selection.category === category
        )
        if (selection) {
            result = selection.overrides.value ?? result
        }
    }

    return result
}
