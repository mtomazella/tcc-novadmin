import { Request } from 'express'
import { GeneralFuzzyField, ObraGetParams, ObraGetRequest } from './types'
import { RequestParameterValidationError } from 'error/index'
import { stringToBoolean } from 'utils/string'
import { extractBoolean, extractNumber, extractString } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, {}, ObraGetRequest>
): ObraGetParams => {
    const {
        id,
        fuzzyName,
        fuzzyDescription,
        fuzzyPhone,
        fuzzyEmail,
        fuzzyAddress,
        fuzzyAddressComplement,
        fuzzyContact,
        generalFuzzyFields,
        generalFuzzyValue,
        order,
        includeClient,
        includeDeleted,
        page,
        limit,
    } = req.query

    const params: ObraGetParams = {
        generalFuzzy: {},
        fuzzy: {},
    } as ObraGetParams

    params.id = extractNumber(id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
    }) as number | undefined

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

    params.fuzzy.name = extractString(fuzzyName, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyName',
    }) as string | undefined

    params.fuzzy.description = extractString(fuzzyDescription, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyDescription',
    }) as string | undefined

    params.fuzzy.phone = extractString(fuzzyPhone, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyPhone',
    }) as string | undefined

    params.fuzzy.email = extractString(fuzzyEmail, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyEmail',
    }) as string | undefined

    params.fuzzy.address = extractString(fuzzyAddress, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyAddress',
    }) as string | undefined

    params.fuzzy.addressComplement = extractString(fuzzyAddressComplement, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyAddressComplement',
    }) as string | undefined

    params.fuzzy.contact = extractString(fuzzyContact, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyContact',
    }) as string | undefined

    params.generalFuzzy.value = extractString(generalFuzzyValue, {
        allowUndefined: true,
        errorMessage: 'Invalid generalFuzzyValue',
    }) as string | undefined

    if (generalFuzzyValue) {
        const allGeneralFuzzyFields = [
            'name',
            'description',
            'phone',
            'email',
            'address',
            'addressComplement',
            'contact',
        ]
        if (!generalFuzzyFields) {
            params.generalFuzzy.fields =
                allGeneralFuzzyFields as GeneralFuzzyField[]
        } else {
            params.generalFuzzy.fields = generalFuzzyFields
                .split(',')
                .map((s) => s.trim())
                .filter((s) =>
                    allGeneralFuzzyFields.includes(s)
                ) as GeneralFuzzyField[]
        }
    }

    params.order = extractString(order, {
        allowUndefined: true,
        defaultValue: 'updatedAt',
        errorMessage: 'Invalid order',
    }) as ObraGetParams['order']

    params.includeClient = extractBoolean(includeClient, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid includeClient',
    }) as boolean

    params.includeDeleted = extractBoolean(includeDeleted, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid includeDeleted',
    }) as boolean

    return params
}
