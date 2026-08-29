import { Request } from 'express'
import { QuoteGetParams, QuoteGetRequest } from './types'
import {
    extractActivationStatus,
    extractBoolean,
    extractNumber,
    extractString,
} from 'utils/request'
import {
    defaultOrderOption,
    QuoteFuzzyField,
    QuoteFuzzyFields,
    RootStatus,
    RootStatuses,
} from 'data/quote'
import { QuoteVersionType } from '@novadmin/lib/types'

export const extractParams = (
    req: Request<{}, {}, {}, QuoteGetRequest>
): QuoteGetParams => {
    const {
        id,
        parentId,
        rootId,
        versionType,
        clientId,
        obraId,
        createdByUserId,
        quoteNumber,
        revisionNumber,
        additionNumber,
        yearCode,
        rootStatus,
        generalFuzzyFields,
        generalFuzzyValue,
        includeVersionSummary,
        includeClient,
        includeObra,
        activationStatus,
        order,
        page,
        limit,
    } = req.query

    const params: QuoteGetParams = {
        generalFuzzy: {},
    } as QuoteGetParams

    params.id = extractNumber(id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
    }) as number | undefined

    params.parentId = extractNumber(parentId, {
        allowUndefined: true,
        errorMessage: 'Invalid parentId',
    }) as number | undefined

    params.rootId = extractNumber(rootId, {
        allowUndefined: true,
        errorMessage: 'Invalid rootId',
    }) as number | undefined

    params.versionType = extractNumber(versionType, {
        allowUndefined: true,
        errorMessage: 'Invalid versionType',
    }) as QuoteVersionType | undefined

    params.clientId = extractNumber(clientId, {
        allowUndefined: true,
        errorMessage: 'Invalid clientId',
    }) as number | undefined

    params.obraId = extractNumber(obraId, {
        allowUndefined: true,
        errorMessage: 'Invalid obraId',
    }) as number | undefined

    params.createdByUserId = extractNumber(createdByUserId, {
        allowUndefined: true,
        errorMessage: 'Invalid createdByUserId',
    }) as number | undefined

    params.quoteNumber = extractString(quoteNumber, {
        allowUndefined: true,
        errorMessage: 'Invalid quoteNumber',
    }) as string | undefined

    params.revisionNumber = extractNumber(revisionNumber, {
        allowUndefined: true,
        errorMessage: 'Invalid revisionNumber',
    }) as number | undefined

    params.additionNumber = extractNumber(additionNumber, {
        allowUndefined: true,
        errorMessage: 'Invalid additionNumber',
    }) as number | undefined

    params.yearCode = extractNumber(yearCode, {
        allowUndefined: true,
        errorMessage: 'Invalid yearCode',
    }) as number | undefined

    params.rootStatus = extractString(rootStatus, {
        allowUndefined: true,
        errorMessage: 'Invalid rootStatus',
        validationFunction: (value) =>
            RootStatuses.includes((value ?? '') as RootStatus),
    }) as QuoteGetParams['rootStatus']

    params.includeVersionSummary = extractBoolean(includeVersionSummary, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid includeVersionSummary',
    }) as boolean

    params.includeClient = extractBoolean(includeClient, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid includeClient',
    }) as boolean

    params.includeObra = extractBoolean(includeObra, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid includeObra',
    }) as boolean

    params.page = extractNumber(page, {
        allowUndefined: true,
        defaultValue: 1,
        errorMessage: 'Invalid page',
    }) as number

    params.limit = extractNumber(limit, {
        allowUndefined: true,
        defaultValue: 10,
        errorMessage: 'Invalid limit',
    }) as number

    params.generalFuzzy.value = extractString(generalFuzzyValue, {
        allowUndefined: true,
        errorMessage: 'Invalid generalFuzzyValue',
    }) as string | undefined

    if (generalFuzzyValue) {
        const allGeneralFuzzyFields = QuoteFuzzyFields
        if (!generalFuzzyFields) {
            params.generalFuzzy.fields = allGeneralFuzzyFields
        } else {
            params.generalFuzzy.fields = generalFuzzyFields
                .split(',')
                .map((s) => s.trim())
                .filter((s) =>
                    allGeneralFuzzyFields.includes(s as QuoteFuzzyField)
                ) as QuoteFuzzyField[]
        }
    }

    params.order = extractString(order, {
        allowUndefined: true,
        defaultValue: defaultOrderOption,
        errorMessage: 'Invalid order',
    }) as QuoteGetParams['order']

    params.activationStatus = extractActivationStatus(activationStatus, {
        allowUndefined: true,
        defaultStatus: 'active',
        errorMessage: 'Invalid activationStatus',
    }) as QuoteGetParams['activationStatus']

    return params
}
