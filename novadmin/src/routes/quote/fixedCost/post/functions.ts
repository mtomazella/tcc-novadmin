import { Request } from 'express'
import { QuoteFixedCostPostParams, QuoteFixedCostPostBody } from './types'
import { RequestParameterValidationError } from 'error/index'
import { extractNumber, extractString } from 'utils/request'
import {
    QuoteFixedCostValueType,
    QuoteFixedCostValueTypes,
} from '@novadmin/lib/types'

export const extractParams = (
    req: Request<{}, {}, QuoteFixedCostPostBody, {}>
): QuoteFixedCostPostParams => {
    const { record } = req.body ?? {}

    const params: QuoteFixedCostPostParams = {
        record,
    } as QuoteFixedCostPostParams

    if (!record) {
        throw new RequestParameterValidationError(
            'Missing record in request body'
        )
    }

    params.record.id = extractString(record.id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
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

    params.record.valueType = extractString(record.valueType, {
        allowUndefined: false,
        errorMessage: 'Invalid valueType',
        validationFunction: (value) =>
            QuoteFixedCostValueTypes.includes(
                (value ?? '') as QuoteFixedCostValueType
            ),
    }) as QuoteFixedCostValueType

    params.record.value = extractNumber(record.value, {
        allowUndefined: false,
        errorMessage: 'Invalid value',
    }) as number

    return params
}
