import type { AreaOrderGroup, QuoteScope } from '../types/index.js'

export type { AreaOrderGroup }

export function buildDefaultAreaOrder(scopes: QuoteScope[]): AreaOrderGroup[] {
    if (scopes.length === 0) return []
    const sortedScopeIds = [...scopes]
        .sort((scopeA, scopeB) => (scopeA.id ?? 0) - (scopeB.id ?? 0))
        .map((scope) => scope.id!)
    return [
        {
            id: crypto.randomUUID(),
            name: '1° FORNECIMENTO',
            scopeIds: sortedScopeIds,
        },
    ]
}

export function resolveAreaOrder(
    scopes: QuoteScope[],
    stored: AreaOrderGroup[]
): AreaOrderGroup[] {
    if (stored.length === 0) return buildDefaultAreaOrder(scopes)

    const existingScopeIds = new Set(
        scopes
            .filter((scope) => scope.id !== undefined)
            .map((scope) => scope.id!)
    )

    const resolvedGroups: AreaOrderGroup[] = stored.map((group) => ({
        ...group,
        scopeIds: group.scopeIds.filter((scopeId) =>
            existingScopeIds.has(scopeId)
        ),
    }))

    const referencedIds = new Set<number>(
        resolvedGroups.flatMap((group) => group.scopeIds)
    )

    const unreferencedScopeIds = scopes
        .filter(
            (scope) => scope.id !== undefined && !referencedIds.has(scope.id)
        )
        .map((scope) => scope.id!)

    if (unreferencedScopeIds.length > 0 && resolvedGroups.length > 0) {
        const lastGroup = resolvedGroups[resolvedGroups.length - 1]
        lastGroup.scopeIds = [...lastGroup.scopeIds, ...unreferencedScopeIds]
    }

    return resolvedGroups
}
