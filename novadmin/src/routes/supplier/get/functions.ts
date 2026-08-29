import { Request } from 'express'
import { SupplierGetParams, SupplierGetRequest } from './types'
import { extractActivationStatus, extractBoolean, extractNumber, extractString, extractStringList } from 'utils/request'
import { SupplierFuzzyFields } from 'data/supplier'

export const extractParams = (
    req: Request<{}, {}, {}, SupplierGetRequest>
): SupplierGetParams => {
    const {
        id,
        materialId,
        materialSkus,
        includeMaterials,
        generalFuzzyFields,
        generalFuzzyValue,
        order,
        activationStatus,
        materialActivationStatus,
        page,
        limit,
    } = req.query

    const params: SupplierGetParams = {
        generalFuzzy: {},
    } as SupplierGetParams

    params.id = extractNumber(id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
    }) as number | undefined

    params.materialId = extractNumber(materialId, {
        allowUndefined: true,
        errorMessage: 'Invalid supplierId',
    }) as number | undefined

    params.materialSkus = extractStringList(materialSkus, {
        allowUndefined: true,
        errorMessage: 'Invalid materialSkus',
    }) as string[] | undefined

    params.includeMaterials = extractBoolean(includeMaterials, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid includeMaterials',
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
            'name',
            'material_sku',
            'material_name',
            'material_description',
        ] as SupplierFuzzyFields[]
        if (!generalFuzzyFields) {
            params.generalFuzzy.fields =
                allGeneralFuzzyFields as SupplierFuzzyFields[]
        } else {
            params.generalFuzzy.fields = generalFuzzyFields
                .split(',')
                .map((s) => s.trim())
                .filter((s) =>
                    (allGeneralFuzzyFields as string[]).includes(s)
                ) as SupplierFuzzyFields[]
        }
    }

    params.order = extractString(order, {
        allowUndefined: true,
        defaultValue: 'updatedAt_desc',
        errorMessage: 'Invalid order',
    }) as SupplierGetParams['order']

    params.activationStatus = extractActivationStatus(activationStatus, {
        allowUndefined: true,
        defaultStatus: 'active',
        errorMessage: 'Invalid activationStatus',
    }) as SupplierGetParams['activationStatus']

    params.materialActivationStatus = extractActivationStatus(materialActivationStatus, {
        allowUndefined: true,
        defaultStatus: 'active',
        errorMessage: 'Invalid materialActivationStatus',
    }) as SupplierGetParams['materialActivationStatus']

    return params
}
