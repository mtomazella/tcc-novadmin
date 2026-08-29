import { Request } from "express"
import { ClientPostParams, ClientPostBody } from "./types"
import { RequestParameterValidationError } from "error/index"

export const extractParams = (
    req: Request<{}, {}, ClientPostBody, {}>
): ClientPostParams => {
    const {
        record
    } = req.body ?? {}

    const params: ClientPostParams = {
    } as ClientPostParams

    if (!record) {
        throw new RequestParameterValidationError('Missing record in request body')
    }

    if (!record.name) {
        throw new RequestParameterValidationError('Missing name in record')
    } else if (record.name.length > 115) {
        throw new RequestParameterValidationError('Name is too long')
    }

    if (record.address && record.address.length > 50) {
        throw new RequestParameterValidationError('Address is too long')
    }

    if (record.city && record.city.length > 30) {
        throw new RequestParameterValidationError('City is too long')
    }

    if (record.state && record.state.length > 2) {
        throw new RequestParameterValidationError('State is too long')
    }

    if (record.zipCode && record.zipCode.length > 8) {
        throw new RequestParameterValidationError('Zip code is too long')
    }

    if (record.phone && record.phone.length > 15) {
        throw new RequestParameterValidationError('Phone number is too long')
    }

    params.record = record

    return params
}