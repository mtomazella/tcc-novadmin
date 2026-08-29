import { Request } from 'express'
import {
    QuoteFixedCostBatchPostParams,
    QuoteFixedCostBatchPostBody,
} from './types'
import { RequestParameterValidationError } from 'error/index'
import { extractNumber, extractString } from 'utils/request'
import {
    QuoteFixedCostValueType,
    QuoteFixedCostValueTypes,
} from '@novadmin/lib/types'

export const extractParams = (
    req: Request<{}, {}, QuoteFixedCostBatchPostBody, {}>
): QuoteFixedCostBatchPostParams => {
    const { records } = req.body ?? {}

    if (!records || !Array.isArray(records)) {
        throw new RequestParameterValidationError(
            'Missing records in request body'
        )
    }

    const params: QuoteFixedCostBatchPostParams = {
        records: Array(records.length)
            .fill(null)
            .map(() => ({})),
    } as QuoteFixedCostBatchPostParams

    records.forEach((record, index) => {
        params.records[index].id = extractString(record.id, {
            allowUndefined: false,
            errorMessage: `${index}: Invalid id`,
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

        params.records[index].valueType = extractString(record.valueType, {
            allowUndefined: false,
            errorMessage: `${index}: Invalid valueType`,
            validationFunction: (value) =>
                QuoteFixedCostValueTypes.includes(
                    (value ?? '') as QuoteFixedCostValueType
                ),
        }) as QuoteFixedCostValueType

        params.records[index].value = extractNumber(record.value, {
            allowUndefined: false,
            errorMessage: `${index}: Invalid value`,
        }) as number
    })

    return params
}
