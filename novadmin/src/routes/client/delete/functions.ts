import { Request } from "express"
import { ClientDeleteParams, ClientDeleteRequest } from "./types"
import { RequestParameterValidationError } from "error/index"

export const extractParams = (
    req: Request<{}, {}, {}, ClientDeleteRequest>
): ClientDeleteParams => {
    const {
        id,
    } = req.query ?? {}

    const params: ClientDeleteParams = {
    } as ClientDeleteParams

    if (!id || typeof id !== 'string') {
        throw new RequestParameterValidationError('Invalid or missing id parameter')
    }
    params.id = id

    return params
}