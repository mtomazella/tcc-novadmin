import { Request } from 'express'
import { MaterialBatchPostParams, MaterialBatchPostBody } from './types'
import { RequestParameterValidationError } from 'error/index'
import { extractNumber, extractString } from 'utils/request'
import { MaterialType, MaterialTypes } from '@novadmin/lib/types'

export const extractParams = (
    req: Request<{}, {}, MaterialBatchPostBody, {}>
): MaterialBatchPostParams => {
    const { records } = req.body ?? {}

    if (!records || !Array.isArray(records)) {
        throw new RequestParameterValidationError(
            'Missing records in request body'
        )
    }

    const params: MaterialBatchPostParams = {
        records: Array(records.length)
            .fill(null)
            .map(() => ({})),
    } as MaterialBatchPostParams

    records.forEach((record, index) => {
        params.records[index].id = extractNumber(record.id, {
            allowUndefined: true,
            errorMessage: `${index}: Invalid id`,
        }) as number | undefined

        params.records[index].supplierId = extractNumber(record.supplierId, {
            allowUndefined: false,
            errorMessage: `${index}: Invalid supplierId`,
        }) as number

        params.records[index].sku = extractString(record.sku, {
            allowUndefined: false,
            errorMessage: `${index}: Invalid sku`,
            validationFunction: (value) =>
                value!.length > 0 && value!.length <= 100,
        }) as string

        params.records[index].name = extractString(record.name, {
            allowUndefined: false,
            errorMessage: `${index}: Invalid name`,
            validationFunction: (value) =>
                value!.length > 0 && value!.length <= 150,
        }) as string

        params.records[index].description = extractString(record.description, {
            allowUndefined: true,
            errorMessage: `${index}: Invalid description`,
        }) as string | undefined

        params.records[index].type = extractString(record.type, {
            allowUndefined: false,
            errorMessage: `${index}: Invalid type`,
            validationFunction: (value) =>
                MaterialTypes.includes((value ?? '') as MaterialType),
        }) as MaterialType

        params.records[index].value = extractNumber(record.value, {
            allowUndefined: false,
            errorMessage: `${index}: Invalid value`,
        }) as number
    })

    return params
}
