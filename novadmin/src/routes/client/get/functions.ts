import { Request } from 'express'
import { ClientGetParams, ClientGetRequest, GeneralFuzzyField } from './types'
import { RequestParameterValidationError } from 'error/index'
import { stringToBoolean } from 'utils/string'
import { extractBoolean, extractNumber, extractString } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, {}, ClientGetRequest>
): ClientGetParams => {
    const {
        id,
        fuzzyName,
        fuzzyAddress,
        fuzzyCity,
        fuzzyPhone,
        fuzzyState,
        fuzzyZipCode,
        generalFuzzyFields,
        generalFuzzyValue,
        order,
        includeDeleted,
        page,
        limit,
    } = req.query

    const params: ClientGetParams = {
        generalFuzzy: {},
        fuzzy: {},
    } as ClientGetParams

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

    params.fuzzy.address = extractString(fuzzyAddress, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyAddress',
    }) as string | undefined

    params.fuzzy.city = extractString(fuzzyCity, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyCity',
    }) as string | undefined

    params.fuzzy.state = extractString(fuzzyState, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyState',
    }) as string | undefined

    params.fuzzy.zipCode = extractString(fuzzyZipCode, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyZipCode',
    }) as string | undefined

    params.fuzzy.phone = extractString(fuzzyPhone, {
        allowUndefined: true,
        errorMessage: 'Invalid fuzzyPhone',
    }) as string | undefined

    params.generalFuzzy.value = extractString(generalFuzzyValue, {
        allowUndefined: true,
        errorMessage: 'Invalid generalFuzzyValue',
    }) as string | undefined

    if (generalFuzzyValue) {
        const allGeneralFuzzyFields = [
            'name',
            'address',
            'city',
            'state',
            'zipCode',
            'phone',
        ]
        if (!generalFuzzyFields) {
            params.generalFuzzy.fields =
                allGeneralFuzzyFields as GeneralFuzzyField[]
        } else {
            params.generalFuzzy.fields = generalFuzzyFields
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) =>
                    allGeneralFuzzyFields.includes(s)
                ) as GeneralFuzzyField[]
        }
    }

    params.order = extractString(order, {
        allowUndefined: true,
        defaultValue: 'updatedAt_desc',
        errorMessage: 'Invalid order',
    }) as ClientGetParams['order']

    params.includeDeleted = extractBoolean(includeDeleted, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid includeDeleted',
    }) as boolean

    return params
}
