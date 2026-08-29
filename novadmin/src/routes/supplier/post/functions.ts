import { Request } from 'express'
import { SupplierPostParams, SupplierPostBody } from './types'
import { RequestParameterValidationError } from 'error/index'
import { extractNumber, extractString } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, SupplierPostBody, {}>
): SupplierPostParams => {
    const { record } = req.body ?? {}

    const params: SupplierPostParams = {
        record,
    } as SupplierPostParams

    if (!record) {
        throw new RequestParameterValidationError(
            'Missing record in request body'
        )
    }

    params.record.id = extractNumber(record.id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
    }) as number | undefined

    params.record.name = extractString(record.name, {
        allowUndefined: false,
        errorMessage: 'Invalid name',
        validationFunction: (value) =>
            value!.length > 0 && value!.length <= 200,
    }) as string

    return params
}
