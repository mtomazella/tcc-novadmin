import { Request } from 'express'
import { MaterialGetParams, MaterialGetRequest } from './types'
import {
    extractActivationStatus,
    extractBoolean,
    extractNumber,
    extractString,
} from 'utils/request'
import { MaterialFuzzyFields } from 'data/material'
import { MaterialType } from '@novadmin/lib/types'

export const extractParams = (
    req: Request<{}, {}, {}, MaterialGetRequest>
): MaterialGetParams => {
    const {
        id,
        supplierId,
        type,
        includeSupplier,
        generalFuzzyFields,
        generalFuzzyValue,
        order,
        activationStatus,
        page,
        limit,
    } = req.query

    const params: MaterialGetParams = {
        generalFuzzy: {},
    } as MaterialGetParams

    params.id = extractNumber(id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
    }) as number | undefined

    params.supplierId = extractNumber(supplierId, {
        allowUndefined: true,
        errorMessage: 'Invalid supplierId',
    }) as number | undefined

    params.type = extractString(type, {
        allowUndefined: true,
        errorMessage: 'Invalid type',
    }) as MaterialType | undefined

    params.includeSupplier = extractBoolean(includeSupplier, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid includeSupplier',
    })

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
        const allGeneralFuzzyFields = [
            'sku',
            'name',
            'description',
            'supplier_name',
        ] as MaterialFuzzyFields[]
        if (!generalFuzzyFields) {
            params.generalFuzzy.fields =
                allGeneralFuzzyFields as MaterialFuzzyFields[]
        } else {
            params.generalFuzzy.fields = generalFuzzyFields
                .split(',')
                .map((s) => s.trim())
                .filter((s) =>
                    (allGeneralFuzzyFields as string[]).includes(s)
                ) as MaterialFuzzyFields[]
        }
    }

    params.order = extractString(order, {
        allowUndefined: true,
        defaultValue: 'sku_asc',
        errorMessage: 'Invalid order',
    }) as MaterialGetParams['order']

    params.activationStatus = extractActivationStatus(activationStatus, {
        allowUndefined: true,
        defaultStatus: 'active',
        errorMessage: 'Invalid activationStatus',
    }) as MaterialGetParams['activationStatus']

    return params
}
