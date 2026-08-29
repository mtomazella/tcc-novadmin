import { Request } from 'express'
import { ProfileDeleteParams, ProfileDeleteRequest } from './types'
import { extractNumber } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, {}, ProfileDeleteRequest>
): ProfileDeleteParams => {
    const { id } = req.query ?? {}

    const params: ProfileDeleteParams = {} as ProfileDeleteParams

    params.id = extractNumber(id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
    }) as number

    return params
}
