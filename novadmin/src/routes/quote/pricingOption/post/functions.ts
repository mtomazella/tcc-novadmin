import { Request } from 'express'
import {
    QuotePricingOptionPostParams,
    QuotePricingOptionPostBody,
} from './types'
import { RequestParameterValidationError } from 'error/index'
import { extractNumber, extractString } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, QuotePricingOptionPostBody, {}>
): QuotePricingOptionPostParams => {
    const { record } = req.body ?? {}

    const params: QuotePricingOptionPostParams = {
        record,
    } as QuotePricingOptionPostParams

    if (!record) {
        throw new RequestParameterValidationError(
            'Missing record in request body'
        )
    }

    params.record.id = extractString(record.id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
    }) as string | undefined

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

    params.record.valueReto = extractNumber(record.valueReto, {
        allowUndefined: false,
        errorMessage: 'Invalid value reto',
    }) as number

    params.record.valueCambotado = extractNumber(record.valueCambotado, {
        allowUndefined: false,
        errorMessage: 'Invalid value cambotado',
    }) as number

    params.record.valueGarfo = extractNumber(record.valueGarfo, {
        allowUndefined: false,
        errorMessage: 'Invalid value garfo',
    }) as number

    return params
}
