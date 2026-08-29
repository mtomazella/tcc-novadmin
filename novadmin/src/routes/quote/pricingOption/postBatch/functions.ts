import { Request } from 'express'
import {
    QuotePricingOptionBatchPostParams,
    QuotePricingOptionBatchPostBody,
} from './types'
import { RequestParameterValidationError } from 'error/index'
import { extractNumber, extractString } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, QuotePricingOptionBatchPostBody, {}>
): QuotePricingOptionBatchPostParams => {
    const { records } = req.body ?? {}

    if (!records || !Array.isArray(records)) {
        throw new RequestParameterValidationError(
            'Missing records in request body'
        )
    }

    const params: QuotePricingOptionBatchPostParams = {
        records: Array(records.length)
            .fill(null)
            .map(() => ({})),
    } as QuotePricingOptionBatchPostParams

    records.forEach((record, index) => {
        params.records[index].id = extractString(record.id, {
            allowUndefined: true,
            errorMessage: `${index}: Invalid id`,
        }) as string | undefined

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

        params.records[index].valueReto = extractNumber(record.valueReto, {
            allowUndefined: false,
            errorMessage: `${index}: Invalid value reto`,
        }) as number

        params.records[index].valueCambotado = extractNumber(
            record.valueCambotado,
            {
                allowUndefined: false,
                errorMessage: `${index}: Invalid value cambotado`,
            }
        ) as number

        params.records[index].valueGarfo = extractNumber(record.valueGarfo, {
            allowUndefined: false,
            errorMessage: `${index}: Invalid value garfo`,
        }) as number
    })

    return params
}
