import { Request } from 'express'
import { RequestParameterValidationError } from 'error/index'
import { QuoteImportPostParams, QuoteImportPostBody } from './types'
import { extractNumber, extractString } from 'utils/request'
import { validateAndExtractUpsertRecord as validateAndExtractElement } from '../element/common'
import { validateAndExtractUpsertRecord as validateAndExtractScope } from '../scope/common'
import type {
    QuoteImportScopeRecord,
    QuoteImportElementRecord,
} from 'data/quote/import'

export const extractParams = (
    req: Request<{}, {}, QuoteImportPostBody, {}>
): QuoteImportPostParams => {
    const body = req.body ?? {}

    const quoteId = extractNumber(body.quoteId, {
        allowUndefined: false,
        errorMessage: 'Invalid quoteId',
    }) as number

    if (!body.scopes || !Array.isArray(body.scopes)) {
        throw new RequestParameterValidationError(
            'Missing or invalid scopes array in request body'
        )
    }

    if (!body.elements || !Array.isArray(body.elements)) {
        throw new RequestParameterValidationError(
            'Missing or invalid elements array in request body'
        )
    }

    const scopes: QuoteImportScopeRecord[] = body.scopes.map(
        (record: Record<string, any>, index: number) => {
            const temporaryId = extractString(record.temporaryId, {
                allowUndefined: false,
                errorMessage: `Invalid temporaryId for scope at index ${index}`,
            }) as string
            const existingScopeId = extractNumber(record.existingScopeId, {
                allowUndefined: true,
                errorMessage: `Invalid existingScopeId for scope at index ${index}`,
            }) as number | undefined
            const scope = validateAndExtractScope({
                overriddenFixedCosts: [],
                overriddenProductConsumption: [],
                materials: {},
                materialSelections: [],
                ...record,
                quoteId,
            })
            const {
                id: _id,
                quoteId: _q,
                lockedByUserId: _l,
                lockedAt: _t,
                ...rest
            } = scope
            return {
                ...rest,
                temporaryId,
                existingScopeId,
            } as QuoteImportScopeRecord
        }
    )

    if (
        scopes.some(
            (scope, index) =>
                scopes.findIndex(
                    (s, index2) =>
                        s.temporaryId === scope.temporaryId && index !== index2
                ) !== -1
        )
    ) {
        throw new RequestParameterValidationError(
            'Duplicate temporaryId found in scopes array'
        )
    }

    const elements: QuoteImportElementRecord[] = body.elements.map(
        (el: Record<string, any>, index: number) => {
            const scopeTemporaryId = extractString(el.scopeTemporaryId, {
                allowUndefined: true,
                errorMessage: `Invalid scopeTemporaryId for element at index ${index}`,
            }) as string | undefined
            const elementRecord = validateAndExtractElement({
                ...el,
                quoteId,
                scopeId: null,
            })
            const { scopeId: _s, quoteId: _q, ...rest } = elementRecord
            return { ...rest, scopeTemporaryId }
        }
    )

    return { quoteId, scopes, elements }
}
