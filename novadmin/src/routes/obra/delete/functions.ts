import { Request } from 'express'
import { ObraDeleteParams, ObraDeleteRequest } from './types'
import { RequestParameterValidationError } from 'error/index'

export const extractParams = (
    req: Request<{}, {}, {}, ObraDeleteRequest>
): ObraDeleteParams => {
    const { id } = req.query ?? {}

    const params: ObraDeleteParams = {} as ObraDeleteParams

    if (!id || typeof id !== 'string') {
        throw new RequestParameterValidationError(
            'Invalid or missing id parameter'
        )
    }
    params.id = id

    return params
}
