import { Request } from 'express'
import { ObraPostParams, ObraPostBody } from './types'
import { RequestParameterValidationError } from 'error/index'

export const extractParams = (
    req: Request<{}, {}, ObraPostBody, {}>
): ObraPostParams => {
    const { record } = req.body ?? {}

    const params: ObraPostParams = {} as ObraPostParams

    if (!record) {
        throw new RequestParameterValidationError(
            'Missing record in request body'
        )
    }

    if (!record.name) {
        throw new RequestParameterValidationError('Missing name in record')
    } else if (record.name.length > 60) {
        throw new RequestParameterValidationError('Name is too long')
    }

    if (record.phone && record.phone.length > 15) {
        throw new RequestParameterValidationError('Phone is too long')
    }

    if (record.email && record.email.length > 254) {
        throw new RequestParameterValidationError('Email is too long')
    }

    if (record.address && record.address.length > 50) {
        throw new RequestParameterValidationError('Address is too long')
    }

    if (record.addressComplement && record.addressComplement.length > 30) {
        throw new RequestParameterValidationError(
            'Address complement is too long'
        )
    }

    if (record.contact && record.contact.length > 30) {
        throw new RequestParameterValidationError('Contact is too long')
    }

    if (!record.clientId) {
        throw new RequestParameterValidationError('Missing clientId in record')
    }

    params.record = record

    return params
}
