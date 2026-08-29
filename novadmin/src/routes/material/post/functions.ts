import { Request } from 'express'
import { MaterialPostParams, MaterialPostBody } from './types'
import { RequestParameterValidationError } from 'error/index'
import { extractNumber, extractString } from 'utils/request'
import { MaterialType, MaterialTypes } from '@novadmin/lib/types'

export const extractParams = (
    req: Request<{}, {}, MaterialPostBody, {}>
): MaterialPostParams => {
    const { record } = req.body ?? {}

    const params: MaterialPostParams = {
        record,
    } as MaterialPostParams

    if (!record) {
        throw new RequestParameterValidationError(
            'Missing record in request body'
        )
    }

    params.record.id = extractNumber(record.id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
    }) as number | undefined

    params.record.supplierId = extractNumber(record.supplierId, {
        allowUndefined: false,
        errorMessage: 'Invalid supplierId',
    }) as number

    params.record.sku = extractString(record.sku, {
        allowUndefined: false,
        errorMessage: 'Invalid sku',
        validationFunction: (value) =>
            value!.length > 0 && value!.length <= 100,
    }) as string

    params.record.name = extractString(record.name, {
        allowUndefined: false,
        errorMessage: 'Invalid name',
        validationFunction: (value) =>
            value!.length > 0 && value!.length <= 150,
    }) as string

    params.record.description = extractString(record.description, {
        allowUndefined: true,
        errorMessage: 'Invalid description',
    }) as string | undefined

    params.record.type = extractString(record.type, {
        allowUndefined: false,
        errorMessage: 'Invalid type',
        validationFunction: (value) =>
            MaterialTypes.includes((value ?? '') as MaterialType),
    }) as MaterialType

    params.record.value = extractNumber(record.value, {
        allowUndefined: false,
        errorMessage: 'Invalid value',
    }) as number

    return params
}
