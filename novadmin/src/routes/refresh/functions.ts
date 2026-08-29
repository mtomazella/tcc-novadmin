import { Request } from 'express'
import { RefreshParams, RefreshBody } from './types'
import { extractNumber, extractString } from 'utils/request'

export const extractParams = (
    req: Request<{}, {}, RefreshBody, {}>
): RefreshParams => {
    const { token, userId } = req.body ?? {}

    const params: RefreshParams = {} as RefreshParams

    params.token = extractString(token, {
        allowUndefined: false,
        errorMessage: 'Missing token',
    }) as string

    params.userId = extractNumber(userId, {
        allowUndefined: false,
        errorMessage: 'Missing userId',
    }) as number

    return params
}
