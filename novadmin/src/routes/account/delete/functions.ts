import { Request } from 'express'
import { UserDeleteParams, UserDeleteRequest } from './types'
import { extractNumber } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, {}, UserDeleteRequest>
): UserDeleteParams => {
    const { id } = req.query ?? {}

    const params: UserDeleteParams = {} as UserDeleteParams

    params.id = extractNumber(id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
    }) as number

    return params
}
