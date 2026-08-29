import {
    AuthenticationError,
    RequestParameterValidationError,
} from 'error/index'
import { Handler, Request, Response } from 'express'
import { LoginBody, LoginResponse } from './types'
import { extractParams, logger } from './functions'
import { login as authLogin } from 'auth/login'
import {
    BadRequest,
    InternalServerError,
    Success,
    Unauthorized,
} from 'utils/response'

export const login: Handler = async (
    req: Request<{}, {}, LoginBody, {}>,
    res: Response<LoginResponse>
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
            loginResult = await authLogin({
                username: params.username,
                password: params.password,
            })
        } catch (error) {
            if (error instanceof AuthenticationError) {
                return Unauthorized(res, error.message)
            }

            console.error('Error during login:', error)
            return InternalServerError(res, 'Login failed')
        }

        logger.info(`User ${params.username} logged in successfully`)
        return Success(res, {
            ...loginResult,
            expiresAt: loginResult.expiresAt.toISOString(),
        })
    } catch (error) {
        logger.error('Error in login handler:', error)
        return InternalServerError(res)
    }
}
