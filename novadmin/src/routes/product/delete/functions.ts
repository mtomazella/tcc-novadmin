import { Request } from 'express'
import { ProductDeleteParams, ProductDeleteRequest } from './types'
import { RequestParameterValidationError } from 'error/index'

export const extractParams = (
    req: Request<{}, {}, {}, ProductDeleteRequest>
): ProductDeleteParams => {
    const { id } = req.query ?? {}

    const params: ProductDeleteParams = {} as ProductDeleteParams

    if (!id || typeof id !== 'string') {
        throw new RequestParameterValidationError(
            'Invalid or missing id parameter'
        )
    }
    params.id = id

    return params
}
