import {
    AuthenticationError,
    RequestParameterValidationError,
} from 'error/index'
import { Handler, Request, Response } from 'express'
import { RefreshBody, RefreshResponse } from './types'
import { extractParams } from './functions'
import { refresh as authRefresh } from 'auth/refresh'
import {
    BadRequest,
    InternalServerError,
    Success,
    Unauthorized,
} from 'utils/response'

export const refresh: Handler = async (
    req: Request<{}, {}, RefreshBody, {}>,
    res: Response<RefreshResponse>
): Promise<any> => {
    try {
        let params
        try {
            params = extractParams(req)
        } catch (error) {
            if (error instanceof RequestParameterValidationError) {
                return BadRequest(res, error.message)
            }
            throw error
        }

        let loginResult
        try {
            loginResult = await authRefresh(params)
        } catch (error) {
            if (error instanceof AuthenticationError) {
                return Unauthorized(res, error.message)
            }

            console.error('Error during refresh:', error)
            return InternalServerError(res, 'Refresh failed')
        }

        return Success(res, {
            ...loginResult,
            expiresAt: loginResult.expiresAt.toISOString(),
        })
    } catch (error) {
        console.error('Error in refresh handler:', error)
        return InternalServerError(res)
    }
}
