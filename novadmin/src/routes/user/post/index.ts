import { upsert } from 'data/user'
import {
    PermissionError,
    RequestParameterValidationError,
    UpsertError,
} from 'error/index'
import { Handler, Request, Response } from 'express'
import { UserPostBody, UserPostResponse } from './types'
import { extractParams, validatePermissions } from './functions'
import {
    BadRequest,
    Conflict,
    Forbidden,
    InternalServerError,
    Success,
} from 'utils/response'
import { checkPermissions } from 'auth/permissions'

export const userPost: Handler = async (
    req: Request<{}, {}, UserPostBody, {}>,
    res: Response<UserPostResponse>
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

        validatePermissions({
            user: res?.locals?.user,
            params,
        })

        let result
        try {
            result = await upsert(params)
        } catch (error) {
            if (error instanceof UpsertError) {
                return Conflict(res, error.message)
            }
            console.error('Error upserting user:', error)
            return InternalServerError(res, 'Failed to upsert user')
        }

        return Success(res, {
            meta: params,
            data: result,
        })
    } catch (error) {
        if (error instanceof PermissionError) {
            return Forbidden(res, error.message)
        }

        console.error('Error in userPost handler:', error)
        return InternalServerError(res)
    }
}
