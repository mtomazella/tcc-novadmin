import { describe, it, expect } from 'vitest'
import { buildDefaultAreaOrder, resolveAreaOrder } from '../metragens.js'
import type { QuoteScope } from '../../types/index.js'

function makeScope(id: number): QuoteScope {
    return {
        id,
        quoteId: 1,
        name: `Scope ${id}`,
        overriddenFixedCosts: [],
        overriddenProductConsumption: [],
        materialSelections: [],
        materials: {},
    }
}

describe('buildDefaultAreaOrder', () => {
    it('returns empty array when given no scopes', () => {
        const groups = buildDefaultAreaOrder([])
        expect(groups).toHaveLength(0)
    })

    it('creates exactly one group containing all scope ids', () => {
        const scopes = [makeScope(3), makeScope(1), makeScope(2)]
        const groups = buildDefaultAreaOrder(scopes)
        expect(groups).toHaveLength(1)
        expect(groups[0].name).toBe('1° FORNECIMENTO')
        expect(groups[0].scopeIds).toEqual([1, 2, 3])
    })

    it('sorts scopes by id ascending regardless of input order', () => {
        const scopes = [makeScope(10), makeScope(5), makeScope(7)]
        const groups = buildDefaultAreaOrder(scopes)
        expect(groups[0].scopeIds).toEqual([5, 7, 10])
    })

    it('generates a non-empty string id for the group', () => {
        const groups = buildDefaultAreaOrder([makeScope(1)])
        expect(typeof groups[0].id).toBe('string')
        expect(groups[0].id.length).toBeGreaterThan(0)
    })

    it('creates a single group for a single scope', () => {
        const groups = buildDefaultAreaOrder([makeScope(42)])
        expect(groups[0].scopeIds).toEqual([42])
    })
})

describe('resolveAreaOrder', () => {
    it('falls back to buildDefaultAreaOrder when stored is empty', () => {
        const scopes = [makeScope(1), makeScope(2)]
        const groups = resolveAreaOrder(scopes, [])
        expect(groups).toHaveLength(1)
        expect(groups[0].scopeIds).toEqual([1, 2])
    })

    it('preserves stored group names, ids, and order', () => {
        const stored = [{ id: 'abc-123', name: '1ª FASE', scopeIds: [1] }]
        const scopes = [makeScope(1)]
        const groups = resolveAreaOrder(scopes, stored)
        expect(groups[0].id).toBe('abc-123')
        expect(groups[0].name).toBe('1ª FASE')
    })

    it('removes deleted scope ids from their group', () => {
        const stored = [
            { id: 'g1', name: '1° FORNECIMENTO', scopeIds: [1, 2, 3] },
        ]
        const scopes = [makeScope(1), makeScope(3)]
        const groups = resolveAreaOrder(scopes, stored)
        expect(groups[0].scopeIds).toEqual([1, 3])
    })

    it('keeps groups that become empty after deletions', () => {
        const stored = [
            { id: 'g1', name: '1° FORNECIMENTO', scopeIds: [1] },
            { id: 'g2', name: '2° FORNECIMENTO', scopeIds: [2] },
        ]
        const scopes = [makeScope(2)]
        const groups = resolveAreaOrder(scopes, stored)
        expect(groups).toHaveLength(2)
        expect(groups[0].scopeIds).toEqual([])
        expect(groups[1].scopeIds).toEqual([2])
    })

    it('appends new scope ids to the last group', () => {
        const stored = [
            { id: 'g1', name: '1° FORNECIMENTO', scopeIds: [1] },
            { id: 'g2', name: '2° FORNECIMENTO', scopeIds: [2] },
        ]
        const scopes = [makeScope(1), makeScope(2), makeScope(3), makeScope(4)]
        const groups = resolveAreaOrder(scopes, stored)
        expect(groups[1].scopeIds).toContain(3)
        expect(groups[1].scopeIds).toContain(4)
        expect(groups[0].scopeIds).toEqual([1])
    })

    it('does not double-count scopes already in a group', () => {
        const stored = [{ id: 'g1', name: '1° FORNECIMENTO', scopeIds: [1, 2] }]
        const scopes = [makeScope(1), makeScope(2)]
        const groups = resolveAreaOrder(scopes, stored)
        expect(groups[0].scopeIds).toEqual([1, 2])
    })
})
